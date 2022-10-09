#[macro_use]
extern crate lazy_static;
use fs_extra::dir::get_size;
use home::home_dir;
use pretty_bytes::converter::convert;
use std::{collections::HashMap, env::consts::OS, thread};

struct CachePathEntry {
    name: &'static str,
    paths: HashMap<&'static str, &'static str>,
}

lazy_static! {
    static ref CACHE_PATHS: Vec<CachePathEntry> = vec![
        CachePathEntry {
            name: "npm",
            paths: HashMap::from([
                ("linux", ".npm/_cacache"),
                ("windows", "AppData/npm-cache/_cacache"),
            ]),
        },
        CachePathEntry {
            name: "pnpm",
            paths: HashMap::from([
                ("linux", ".local/share/pnpm/store"),
                ("windows", "AppData/Local/pnpm/store"),
                ("macos", "Library/pnpm/store"),
            ]),
        },
        CachePathEntry {
            name: "yarn",
            paths: HashMap::from([
                ("linux", ".cache/yarn"),
                ("windows", "AppData/Local/Yarn/Cache"),
                ("macos", "Library/Caches/Yarn"),
            ]),
        },
        CachePathEntry {
            name: "berry",
            paths: HashMap::from([
                ("linux", ".local/share/yarn/berry"),
                ("windows", "AppData/Local/Yarn/Berry"),
                ("macos", "Library/Caches/Yarn"),
            ]),
        },
    ];
}

#[derive(Debug)]
enum Error {
    FS(fs_extra::error::Error),
    NoHome,
}

impl From<fs_extra::error::Error> for Error {
    fn from(err: fs_extra::error::Error) -> Self {
        Self::FS(err)
    }
}

fn main() -> Result<(), Error> {
    let handles = CACHE_PATHS
        .iter()
        .map(|CachePathEntry { name, paths }| {
            thread::spawn(move || {
                let cache_path = home_dir()
                    .ok_or(Error::NoHome)?
                    .join(paths.get(OS).unwrap_or_else(|| paths.get("linux").unwrap()));
                println!("{} {}", name, convert(get_size(cache_path)? as f64));
                Ok::<(), Error>(())
            })
        })
        .collect::<Vec<_>>();

    for handle in handles {
        handle.join().unwrap()?;
    }

    Ok(())
}
