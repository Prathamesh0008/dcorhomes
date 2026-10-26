// Old harnesses only isolated SQLite paths; running them against MongoDB would be unsafe.
throw Error('This legacy SQLite fixture harness is retired. Build first, then run npm.cmd run check:mongodb for isolated localhost MongoDB tests. It never uses the business database.');
