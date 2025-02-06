# todo-mcp-server

タスク管理システムです。コマンドライン（CLI）とMCPサーバーの両方のインターフェースを提供し、同じtodo.txtファイルで管理を行います。

シンプルで必要最低限の機能を備え、タスク管理をコマンドラインまたはAPIで操作できます。

## インストール

```bash
$ npm install
$ npm run build
```

## MCPサーバーの設定

mcp-server-config.jsonに以下のように設定を追加します：

```json
{
    "todo-mcp-server": {
        "command": "npx",
        "args": [
            "-y",
            "github:hangingman/todo-mcp-server"
        ]
    }
}
```

## 開発時の実行方法

### CLIの実行
```bash
# 基本的な実行方法
$ npm run cli [command]

# 例：
$ npm run cli list          # タスク一覧を表示
$ npm run cli add "タスク名"  # タスクを追加
$ npm run cli list-all      # 完了済みを含むすべてのタスク表示
```

### サーバーの実行
```bash
$ npm run dev:server
```

## 機能一覧

| CLIコマンド     | MCPサーバー機能    | 説明                                                   |
| --------------- | ----------------- | ------------------------------------------------------ |
| init            | todo_init         | ~/todo.txtを作成/初期化します                           |
| add <TASK>      | todo_add_task     | 新しいタスクを追加します                                |
| d, done         | todo_mark_done    | タスクを完了状態にマークします（CLIは対話式選択）        |
| l, list         | todo_list_tasks   | タスク一覧を表示します                                  |
| la, list-all    | todo_list_tasks showCompleted | すべてのタスク（完了済み含む）を一覧表示します |
| del, delete     | -                 | タスクを削除します（対話式選択）                         |
| da, delete-all  | -                 | すべてのタスクを削除します                               |

## データ形式

タスクは~/todo.txtに保存され、[todo.txt形式](https://github.com/todotxt/todo.txt)に準拠しています。基本的な形式は以下の通りです：

```
(A) タスク内容 yyyy-mm-dd id:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx +プロジェクト @コンテキスト
x 完了日 作成日 タスク内容 id:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx +プロジェクト @コンテキスト
```

各要素の説明：
- (A): 優先度（オプション、A-Z）
- タスク内容: 実際のタスクの説明
- yyyy-mm-dd: 作成日
- id:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx: タスクの一意識別子
- +プロジェクト: プロジェクトタグ（オプション、複数可）
- @コンテキスト: コンテキストタグ（オプション、複数可）
- x: 完了マーク（完了タスクの場合のみ）
- 完了日: タスクが完了した日付（完了タスクの場合のみ）

## 特徴

- CLIとMCPサーバーの両方のインターフェースを提供
- 同一のtodo.txtファイルを共有して管理
- CLIでの会話形式の操作と、MCPサーバーでのプログラマティックな操作
- todo.txt形式に準拠したシンプルなテキストファイル管理
- どのテキストエディタからでも編集可能な標準的なフォーマット