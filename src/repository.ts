import { loadData, saveData, type Guard, type ItemData } from "./storage.js";

type HasId = { id: number };

export class Repository<T extends HasId> {
  private readonly fileName: string;
  private readonly isItem: Guard<T>;
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<R>(job: () => Promise<R>): Promise<R> {
    const run = this.queue.then(job);
    this.queue = run.catch(() => {});
    return run;
  }

  constructor(fileName: string, itemValidator: Guard<T>) {
    this.fileName = fileName;
    this.isItem = itemValidator;
  }

  private async getData(): Promise<ItemData<T>> {
    return loadData(this.fileName, this.isItem);
  }

  async findAll(): Promise<T[]> {
    const data = await this.getData();

    return structuredClone(data.items);
  }

  async findById(id: number): Promise<T | undefined> {
    const data = await this.getData();

    return structuredClone(data.items.find((item) => item.id === id));
  }

  async create(newItem: Omit<T, "id">): Promise<T> {
    return this.enqueue(async () => {
      const data = await this.getData();

      const item: unknown = {
        id: data.nextId,
        ...newItem,
      };

      if (!this.isItem(item)) {
        throw new Error(
          `Unknown item was passed to be saved: ${JSON.stringify(item, null, 2)}`,
        );
      }

      data.items.unshift(item);
      data.nextId++;

      await saveData(this.fileName, data);

      return structuredClone(item);
    });
  }

  async update(
    id: number,
    changes: Partial<Omit<T, "id">>,
  ): Promise<T | undefined> {
    return this.enqueue(async () => {
      const data = await this.getData();

      const itemToUpdateIdx = data.items.findIndex((item) => item.id === id);
      if (itemToUpdateIdx === -1) {
        return undefined;
      }
      const mergedItem: unknown = {
        ...data.items[itemToUpdateIdx],
        ...changes,
        id,
      };

      if (!this.isItem(mergedItem)) {
        throw new Error(
          `Invalid values were passed for update: ${JSON.stringify(changes)}`,
        );
      }

      data.items[itemToUpdateIdx] = mergedItem;

      await saveData(this.fileName, data);

      return structuredClone(mergedItem);
    });
  }

  async delete(id: number): Promise<boolean> {
    return this.enqueue(async () => {
      const data = await this.getData();

      const items = data.items;
      const delIdx = items.findIndex((item) => item.id === id);
      if (delIdx === -1) {
        return false;
      }
      items.splice(delIdx, 1);

      await saveData(this.fileName, data);

      return true;
    });
  }
}
