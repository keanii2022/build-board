# The pet (archived)

Build Board used to have a pixel pet that ate your plan steps: it hatched from an egg, earned coins for steps, commits and pushes, bought things in a shop, collected friends, kept your projects in a chest, and lived in a 3D room beside the list. It was retired on 2026-11-21 to make room for the crew messenger.

`src/` is a snapshot of the widget from the day it was archived, with the pet still in it:

- `index.jsx`: the whole widget with the pet, shop, chest and stage
- `sprites.jsx`: every pixel drawing (the pet, items, friends, coins)
- `voxel.jsx`, `stage.jsx`, `vendor/`: the 3D room (three.js)
- `board.py`, `server.py`: the data script and MCP server with the pet's coins and the `pet` tool

Übersicht ignores anything under a `src/` folder, so none of this runs.

## Bringing it back

From the widget folder:

```bash
cp archive/pet/src/*.jsx archive/pet/src/*.py . && cp -R archive/pet/src/vendor .
```

That swaps the whole widget back to the pet version. The pet's save file, `.pet.json`, sits in the widget folder and is gitignored, so an old pet comes back with its coins if that file is still there.
