use std::fs;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use crate::config::error::ConfigError;
use crate::config::error::Result;

const TEMPORARY_SUFFIX: &str = ".writing";

const SET_ASIDE_ATTEMPTS: u32 = 100;

pub fn write_whole(path: &Path, bytes: &[u8]) -> Result<()> {
    if let Some(directory) = path.parent() {
        fs::create_dir_all(directory)
            .map_err(|error| ConfigError::io("creating the directory", directory, &error))?;
    }

    let temporary = temporary_path(path);

    if let Err(error) = write_and_flush(&temporary, bytes) {
        let _ = fs::remove_file(&temporary);

        return Err(error);
    }

    if let Err(error) = fs::rename(&temporary, path) {
        let _ = fs::remove_file(&temporary);

        return Err(ConfigError::io("replacing the file", path, &error));
    }

    Ok(())
}

pub fn set_aside(path: &Path) -> Result<PathBuf> {
    let target = set_aside_path(path).ok_or_else(|| ConfigError::Encoding {
        detail: format!(
            "no free name for {} to be set aside to, after {SET_ASIDE_ATTEMPTS} attempts",
            path.display()
        ),
    })?;

    fs::rename(path, &target)
        .map_err(|error| ConfigError::io("setting the file aside", &target, &error))?;

    Ok(target)
}

#[must_use]
pub fn temporary_path(path: &Path) -> PathBuf {
    let mut name = path.as_os_str().to_owned();
    name.push(TEMPORARY_SUFFIX);

    PathBuf::from(name)
}

fn set_aside_path(path: &Path) -> Option<PathBuf> {
    let stem = path
        .file_stem()
        .unwrap_or_else(|| "file".as_ref())
        .to_string_lossy()
        .into_owned();

    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_secs())
        .unwrap_or_default();

    let first = path.with_file_name(format!("{stem}.invalid-{seconds}.json"));

    if !first.exists() {
        return Some(first);
    }

    (1..SET_ASIDE_ATTEMPTS)
        .map(|attempt| path.with_file_name(format!("{stem}.invalid-{seconds}-{attempt}.json")))
        .find(|candidate| !candidate.exists())
}

fn write_and_flush(path: &Path, bytes: &[u8]) -> Result<()> {
    let mut file =
        fs::File::create(path).map_err(|error| ConfigError::io("opening", path, &error))?;

    file.write_all(bytes)
        .map_err(|error| ConfigError::io("writing", path, &error))?;

    file.sync_all()
        .map_err(|error| ConfigError::io("flushing", path, &error))
}
