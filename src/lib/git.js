import gitSubmodules from "git-submodule-js";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "./process.js";

/** @param {string} path */
export async function checkoutGitSubmodule(path) {
  console.log(`Checking out Git submodule at '${path}'`);

  await exec("git", ["submodule", "update", "--init", path]);
}

/**
 * @param {string} name
 * @param {string} repositoryUrl
 * @param {string} commitSha
 */
export async function checkoutGitRepo(name, repositoryUrl, commitSha) {
  const repoPath = await fs.mkdtemp(
    path.join("build", `${name}-${commitSha}.repo`),
  );
  const processOptions = {
    cwd: repoPath,
  };

  await exec("git", ["init"], processOptions);
  await exec("git", ["remote", "add", "origin", repositoryUrl], processOptions);
  await exec(
    "git",
    ["fetch", "--depth", "1", "origin", commitSha],
    processOptions,
  );
  await exec("git", ["checkout", commitSha], processOptions);
  return repoPath;
}

/** @param {string} path */
export async function sortGitmodules(path) {
  const gitmodulesContent = await fs.readFile(path, "utf-8");

  const gitmodules = gitSubmodules.deserialize(gitmodulesContent);

  const submoduleNames = Object.keys(gitmodules);
  submoduleNames.sort();

  /** @type {import('git-submodule-js').Submodule} */
  const sortedGitmodules = {};

  for (const name of submoduleNames) {
    const entry = gitmodules[name];
    if (entry) {
      sortedGitmodules[name] = entry;
    }
  }

  await fs.writeFile(
    path,
    gitSubmodules.serialize(sortedGitmodules).trimEnd() + "\n",
    "utf-8",
  );
}
