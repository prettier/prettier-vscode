/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See THIRDPARTY in the project root for license information.
 *--------------------------------------------------------*/

import vscode = require("vscode");

let globalState: vscode.Memento;
let workspaceState: vscode.Memento;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFromGlobalState(key: string, defaultValue?: any): any {
  if (!globalState) {
    return defaultValue;
  }
  return globalState.get(key, defaultValue);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateGlobalState(key: string, value: any) {
  if (!globalState) {
    return;
  }
  return globalState.update(key, value);
}

export function setGlobalState(state: vscode.Memento) {
  globalState = state;
}

export function getGlobalState() {
  return globalState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFromWorkspaceState(key: string, defaultValue?: any) {
  if (!workspaceState) {
    return defaultValue;
  }
  return workspaceState.get(key, defaultValue);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateWorkspaceState(key: string, value: any) {
  if (!workspaceState) {
    return;
  }
  return workspaceState.update(key, value);
}

export function setWorkspaceState(state: vscode.Memento) {
  workspaceState = state;
}

export function getWorkspaceState(): vscode.Memento {
  return workspaceState;
}
