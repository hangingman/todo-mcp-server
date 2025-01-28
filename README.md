# todo-mcp-server

タスク管理システムです。コマンドライン（CLI）とMCPサーバーの両方のインターフェースを提供し、同じtodo.txtファイルで管理を行います。

シンプルで必要最低限の機能を備え、タスク管理をコマンドラインまたはAPIで操作できます。

## インストール

```bash
$ npm install
$ npm run build
$ npm install -g .
```

## 機能一覧

| CLIコマンド     | MCPサーバー機能    | 説明                                                   |
| --------------- | ----------------- | ------------------------------------------------------ |
| todo init       | todo_init         | ~/todo.txtを作成/初期化します                           |
| todo add <TASK> | todo_add_task     | 新しいタスクを追加します                                |
| todo d          | todo_mark_done    | タスクを完了状態にマークします（CLIは対話式選択）        |
| todo l          | todo_list_tasks   | タスク一覧を表示します                                  |
| todo la         | todo_list_tasks showCompleted | すべてのタスク（完了済み含む）を一覧表示します |

## データ形式

タスクは~/todo.txtに保存され、以下の形式で管理されます：

```
- [ ] <TASK> yyyy-mm-dd <hash>
```

## 特徴

- CLIとMCPサーバーの両方のインターフェースを提供
- 同一のtodo.txtファイルを共有して管理
- CLIでの会話形式の操作と、MCPサーバーでのプログラマティックな操作
- [todo.txt形式](https://github.com/todotxt/todo.txt)に準拠したシンプルなテキストファイル管理
- どのテキストエディタからでも編集可能な標準的なフォーマット