import { isAbsolute, join } from "@std/path";

import { MEMORY_FILE_PATH, MEMORY_PATH_KEY } from "./constants.ts";
import type { Entity, KnowledgeGraph, Relation } from "./types.ts";

function getLocalPath(): string {
  const pathEnvValue = Deno.env.get(MEMORY_PATH_KEY);
  return pathEnvValue ?
    // If MEMORY_FILE_PATH is just a filename, put it in the same directory as the script
    isAbsolute(pathEnvValue) ? pathEnvValue : join(import.meta.dirname ?? "", pathEnvValue) :
    MEMORY_FILE_PATH;
}

async function readGraphFromFile(path: string): Promise<KnowledgeGraph> {
  const data = await Deno.readTextFile(path);
  const lines = data.split("\n").filter((line) => line.trim() !== "");
  return lines.reduce((graph: KnowledgeGraph, line) => {
    const item = JSON.parse(line);
    if (item.type === "entity") { graph.entities.push(item as Entity); }
    if (item.type === "relation") { graph.relations.push(item as Relation); }
    return graph;
  }, { entities: [], relations: [] });
}

async function unrollKvIterators(
  entities: Deno.KvListIterator<Entity>,
  relations: Deno.KvListIterator<Relation>,
): Promise<KnowledgeGraph> {
  const _entities: Entity[] = [];
  const _relations: Relation[] = [];
  for await (const entry of entities) {
    _entities.push(entry.value);
  }
  for await (const entry of relations) {
    _relations.push(entry.value);
  }
  return { entities: _entities, relations: _relations };
}

// The KnowledgeGraphManager class contains all operations to interact with the knowledge graph
export class KnowledgeGraphManager {
  #kv: Deno.Kv;
  #localPath: string;

  constructor(kv: Deno.Kv) {
    this.#kv = kv;
    this.#localPath = getLocalPath();
  }

  async #getGraphFromKV(): Promise<KnowledgeGraph> {
    const entitiesIter = this.#kv.list<Entity>({ prefix: ["entities"] });
    const relationsIter = this.#kv.list<Relation>({ prefix: ["relations"] });
    return unrollKvIterators(entitiesIter, relationsIter);
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.#getGraphFromKV();
    const exists = (entity: Entity) => !graph.entities.some((e) => e.name === entity.name);
    const newEntities = entities.filter(exists);

    if (newEntities.length > 0) {
      const transaction = this.#kv.atomic();
      for (const entity of newEntities) {
        transaction.set(["entities", entity.name], entity);
      }
      await transaction.commit();
    }

    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.#getGraphFromKV();
    const newRelations = relations.filter((r) =>
      !graph.relations.some((existingRelation) =>
        existingRelation.from === r.from &&
        existingRelation.to === r.to &&
        existingRelation.relationType === r.relationType
      )
    );

    if (newRelations.length > 0) {
      const transaction = this.#kv.atomic();
      for (const relation of newRelations) {
        transaction.set(["relations", relation.from, relation.to, relation.relationType], relation);
      }
      await transaction.commit();
    }

    return newRelations;
  }

  async addObservations(
    observations: { entityName: string; contents: string[] }[],
  ): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const results: { entityName: string; addedObservations: string[] }[] = [];
    const transaction = this.#kv.atomic();

    for (const obs of observations) {
      const entityResult = await this.#kv.get<Entity>(["entities", obs.entityName]);

      if (!entityResult.value) {
        throw new Error(`Entity with name ${obs.entityName} not found`);
      }

      const entity = entityResult.value;
      const newObservations = obs.contents.filter((content) =>
        !entity.observations.includes(content)
      );

      if (newObservations.length > 0) {
        entity.observations.push(...newObservations);
        transaction.set(["entities", obs.entityName], entity);
        results.push({ entityName: obs.entityName, addedObservations: newObservations });
      }
    }

    await transaction.commit();
    return results;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    if (entityNames.length === 0) { return; }

    const transaction = this.#kv.atomic();

    // Delete the entities
    for (const name of entityNames) {
      transaction.delete(["entities", name]);
    }

    // Get all relations first
    const relationsEntries = await this.#getRelationsToDelete(entityNames);

    // Delete relations involving these entities
    for (const key of relationsEntries) {
      transaction.delete(key);
    }

    await transaction.commit();
  }

  async #getRelationsToDelete(entityNames: string[]): Promise<Deno.KvKey[]> {
    const keysToDelete: Deno.KvKey[] = [];
    const relationsIter = this.#kv.list({ prefix: ["relations"] });

    for await (const entry of relationsIter) {
      const key = entry.key;
      // key structure is ["relations", from, to, relationType]
      const from = key[1];
      const to = key[2];

      if (typeof from === "string" && typeof to === "string") {
        if (entityNames.includes(from) || entityNames.includes(to)) {
          keysToDelete.push(key);
        }
      }
    }

    return keysToDelete;
  }

  async deleteObservations(
    deletions: { entityName: string; observations: string[] }[],
  ): Promise<void> {
    const transaction = this.#kv.atomic();

    for (const d of deletions) {
      const entityResult = await this.#kv.get<Entity>(["entities", d.entityName]);

      if (entityResult.value) {
        const entity = entityResult.value;
        entity.observations = entity.observations.filter((o) => !d.observations.includes(o));
        transaction.set(["entities", d.entityName], entity);
      }
    }

    await transaction.commit();
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const transaction = this.#kv.atomic();

    for (const relation of relations) {
      transaction.delete(["relations", relation.from, relation.to, relation.relationType]);
    }

    await transaction.commit();
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.#getGraphFromKV();
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.#getGraphFromKV();
    const lowercaseQuery = query.toLowerCase();

    // Filter entities
    const filteredEntities = graph.entities.filter((e) =>
      e.name.toLowerCase().includes(lowercaseQuery) ||
      e.entityType.toLowerCase().includes(lowercaseQuery) ||
      e.observations.some((o) => o.toLowerCase().includes(lowercaseQuery))
    );

    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map((e) => e.name));

    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter((r) =>
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.#getGraphFromKV();

    // Filter entities
    const filteredEntities = graph.entities.filter((e) => names.includes(e.name));

    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map((e) => e.name));

    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter((r) =>
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  // Export current KV data to file
  async exportToFile(): Promise<void> {
    try {
      const graph = await this.#getGraphFromKV();
      const lines = [
        ...graph.entities.map((e) => JSON.stringify({ type: "entity", ...e })),
        ...graph.relations.map((r) => JSON.stringify({ type: "relation", ...r })),
      ];
      await Deno.writeTextFile(this.#localPath, lines.join("\n"));
    } catch (error) {
      console.error("Error exporting graph to file:", error);
    }
  }

  // Import data from file to KV
  async importFromFile(): Promise<void> {
    let graph: KnowledgeGraph;

    try {
      graph = await readGraphFromFile(this.#localPath);
    } catch (error) {
      if (
        error instanceof Error && "code" in error &&
        error.code === "ENOENT"
      ) {
        graph = { entities: [], relations: [] };
      }
      throw error;
    }

    // Clear existing data first
    const entityEntries = this.#kv.list({ prefix: ["entities"] });
    const relationEntries = this.#kv.list({ prefix: ["relations"] });

    const transaction = this.#kv.atomic();

    for await (const entry of entityEntries) {
      transaction.delete(entry.key);
    }

    for await (const entry of relationEntries) {
      transaction.delete(entry.key);
    }

    // Add entities from file
    for (const entity of graph.entities) {
      transaction.set(["entities", entity.name], entity);
    }

    // Add relations from file
    for (const relation of graph.relations) {
      transaction.set(
        ["relations", relation.from, relation.to, relation.relationType],
        relation,
      );
    }

    await transaction.commit();
  }
}
