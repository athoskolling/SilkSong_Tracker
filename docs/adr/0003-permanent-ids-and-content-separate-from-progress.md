# Permanent ids, with game content kept separate from Progress

Game content lives in versioned data files and Progress stores only the ids a player marked done. Ids are slugs that are never renamed once published, and content changes bump `dataVersion`. This lets patches and DLC update the guide without touching anyone's saved Progress. The cost is discipline: a wrong id can't be fixed by renaming, only by adding a new entry and retiring the old one.
