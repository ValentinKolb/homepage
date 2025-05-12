import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import type { EditorFile } from "../../utils/db";

type FileTreeNode = {
  file?: EditorFile;
  children: FileTreeNode[];
};

/**
 * Recursively sorts a file tree with folders first, then alphabetically by name
 * @param nodes array of FileNode objects to sort
 * @returns sorted array of FileNode objects
 */
function sortFileTreeRecursively(nodes: FileTreeNode[]): FileTreeNode[] {
  // Sort the current level
  const sortedNodes = [...nodes].sort((a, b) => {
    // First sort by type: folders before files
    if (a.file!.type === "folder" && b.file!.type !== "folder") return -1;
    if (a.file!.type !== "folder" && b.file!.type === "folder") return 1;

    // Then sort alphabetically by name (case-insensitive)
    return a.file!.name.toLowerCase().localeCompare(b.file!.name.toLowerCase());
  });

  // Recursively sort children of each node
  sortedNodes.forEach((node) => {
    if (node.children.length > 0) {
      node.children = sortFileTreeRecursively(node.children);
    }
  });

  return sortedNodes;
}

/**
 * Custom hook to create a reactive file tree from a list of files
 * @param files the reactive store or signal containing editor files
 * @returns a reactive store with the file tree structure
 */
function createFileTree(files: EditorFile[]) {
  // Create a separate store for the file tree
  const [fileTree, setFileTree] = createStore<FileTreeNode[]>([]);

  // Effect to update the file tree whenever the files list changes
  createEffect(() => {
    const nodeMap = new Map<number, FileTreeNode>();

    // Create a node for each file
    files.forEach((file) => {
      nodeMap.set(file.id, { file, children: [] });
    });

    const newFileTree: FileTreeNode[] = [];

    // Connect nodes to their parents
    files.forEach((file) => {
      const node = nodeMap.get(file.id)!;
      if (file.parentId != null && nodeMap.has(file.parentId)) {
        const parentNode = nodeMap.get(file.parentId)!;
        parentNode.children.push(node);
      } else {
        // Root nodes
        newFileTree.push(node);
      }
    });

    // Sort the new tree recursively
    const sortedFileTree = sortFileTreeRecursively(newFileTree);

    // Update the file tree store
    setFileTree(sortedFileTree);
  });

  return fileTree;
}

export { createFileTree, type FileTreeNode as FileNode };
