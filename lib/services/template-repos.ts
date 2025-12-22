/**
 * These template repositories must be accessible by your GitHub App installation.
 */

export interface TemplateRepo {
  id: string; // Format: "owner/repo"
  name: string; // Display name
  description: string;
  owner: string;
  repo: string;
}

/**
 * Configure your 3 template repositories here
 * Replace the placeholder values with your actual template repository information
 */
export const TEMPLATE_REPOS: TemplateRepo[] = [
  {
    id: "adnit-ship-it/serenova",
    name: "Serenova Template",
    description: "Serenova template repository",
    owner: "adnit-ship-it",
    repo: "serenova",
  },
  {
    id: "adnit-ship-it/vitalara",
    name: "Vitalara Template",
    description: "Vitalara template repository",
    owner: "adnit-ship-it",
    repo: "vitalara",
  },
  {
    id: "adnit-ship-it/medivora",
    name: "Medivora Template",
    description: "Medivora template repository",
    owner: "adnit-ship-it",
    repo: "medivora",
  },
];

