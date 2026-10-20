export interface Project {
  id: number;
  name: string;
  description: string | null;
}

export function isProject(value: unknown): value is Project {
  if (typeof value !== "object" || value === null) return false;

  return (
    "id" in value &&
    Number.isInteger(value.id) &&
    "name" in value &&
    typeof value.name === "string" &&
    value.name.trim() !== "" &&
    "description" in value &&
    (typeof value.description === "string" || value.description === null)
  );
}

export type NewProject = Omit<Project, "id">;

export function createProject(
  name?: string,
  description?: string | null,
): NewProject {
  if (name === undefined || name.trim() === "") {
    throw new Error("Name for project is required for creation");
  }

  return {
    name: name.trim(),
    description: description?.trim() || null,
  };
}
