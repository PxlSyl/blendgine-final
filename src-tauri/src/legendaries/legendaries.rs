use super::utils::*;
use crate::types::*;
use std::{fs, path::Path};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn read_folder(folder_path: String) -> Result<FolderContent, String> {
    let path = Path::new(&folder_path);

    // Vérifier les sous-dossiers Collection et CollectionWithFilters
    let valid_folder_path = if path.join("CollectionWithFilters").exists() {
        path.join("CollectionWithFilters")
    } else if path.join("Collection").exists() {
        path.join("Collection")
    } else {
        path.to_path_buf()
    };

    // Vérifier la structure des dossiers
    let images_folder = valid_folder_path.join("images");
    let metadata_folder = valid_folder_path.join("metadata");
    let global_metadata_file = metadata_folder.join("_metadata.json");

    // Vérifier l'existence des dossiers requis
    if !images_folder.exists() || !metadata_folder.exists() {
        return Ok(FolderContent {
            is_valid: false,
            error_message: Some(
                "The selected folder must contain 'images' and 'metadata' subfolders.".into(),
            ),
            files: vec![],
        });
    }

    // Vérifier l'existence du fichier _metadata.json
    if !global_metadata_file.exists() {
        return Ok(FolderContent {
            is_valid: false,
            error_message: Some(
                "The 'metadata' folder must contain a '_metadata.json' file.".into(),
            ),
            files: vec![],
        });
    }

    // Lire le contenu des dossiers
    let image_files = match fs::read_dir(&images_folder) {
        Ok(entries) => entries
            .filter_map(Result::ok)
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect::<Vec<String>>(),
        Err(_) => {
            return Ok(FolderContent {
                is_valid: false,
                error_message: Some("Error reading the images folder.".into()),
                files: vec![],
            })
        }
    };

    let metadata_files = match fs::read_dir(&metadata_folder) {
        Ok(entries) => entries
            .filter_map(Result::ok)
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect::<Vec<String>>(),
        Err(_) => {
            return Ok(FolderContent {
                is_valid: false,
                error_message: Some("Error reading the metadata folder.".into()),
                files: vec![],
            })
        }
    };

    // Vérifier que les dossiers ne sont pas vides
    if image_files.is_empty() || metadata_files.len() <= 1 {
        return Ok(FolderContent {
            is_valid: false,
            error_message: Some(
                "Both 'images' and 'metadata' subfolders must contain files.".into(),
            ),
            files: vec![],
        });
    }

    // Vérifier les extensions des fichiers images
    let valid_image_extensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm"];
    let all_images_valid = image_files.iter().all(|file| {
        let extension = Path::new(file)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| format!(".{}", ext.to_lowercase()));
        extension.map_or(false, |ext| valid_image_extensions.contains(&ext.as_str()))
    });

    if !all_images_valid {
        return Ok(FolderContent {
            is_valid: false,
            error_message: Some("The 'images' folder must contain only image files (png, jpg, jpeg, webp, gif, mp4, webm).".into()),
            files: vec![],
        });
    }

    // Vérifier les extensions des fichiers metadata
    let all_metadata_valid = metadata_files.iter().all(|file| {
        file == "_metadata.json"
            || Path::new(file)
                .extension()
                .and_then(|ext| ext.to_str())
                .map_or(false, |ext| ext.to_lowercase() == "json")
    });

    if !all_metadata_valid {
        return Ok(FolderContent {
            is_valid: false,
            error_message: Some("The 'metadata' folder must contain only JSON files.".into()),
            files: vec![],
        });
    }

    // Vérifier que le nombre de fichiers correspond
    if image_files.len() != metadata_files.len() - 1 {
        return Ok(FolderContent {
            is_valid: false,
            error_message: Some("The number of files in 'images' folder must be the same as the number of JSON files in 'metadata' folder (excluding _metadata.json).".into()),
            files: vec![],
        });
    }

    // Tout est valide
    Ok(FolderContent {
        is_valid: true,
        error_message: None,
        files: image_files,
    })
}

#[tauri::command]
pub async fn select_legendary_nfts_folder(app: AppHandle) -> Result<Option<String>, String> {
    let folder = app.dialog().file().blocking_pick_folder();

    match folder {
        Some(path) => Ok(Some(path.to_string())),
        _none => Ok(None),
    }
}

#[tauri::command]
pub async fn validate_legendary_nfts_folder(
    folder_path: String,
) -> Result<ValidationResult, String> {
    let path = Path::new(&folder_path);

    // Get directory entries
    let entries = fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(Result::ok)
        .collect::<Vec<_>>();

    // Filter for directories only
    let directories: Vec<_> = entries
        .into_iter()
        .filter(|entry| entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
        .collect();

    // Rest of the validation logic
    if directories.len() < 2 {
        return Ok(ValidationResult {
            is_valid: false,
            error_message: Some("The folder must contain at least two subfolders.".into()),
        });
    }

    let mut images_folder_path = None;
    let mut metadata_folder_path = None;
    let mut image_count = 0;
    let mut metadata_count = 0;

    // Parcourir les sous-dossiers pour trouver les dossiers d'images et de métadonnées
    for dir in directories {
        let subfolder_path = dir.path();
        let files = match fs::read_dir(&subfolder_path) {
            Ok(entries) => entries.filter_map(Result::ok).collect::<Vec<_>>(),
            Err(_) => continue,
        };

        if files.is_empty() {
            continue;
        }

        if let Some(first_file) = files.first() {
            let extension = first_file
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|s| s.to_lowercase());

            match extension.as_deref() {
                Some("png") | Some("jpg") | Some("jpeg") | Some("webp") | Some("gif")
                | Some("mp4") | Some("webm") => {
                    images_folder_path = Some(subfolder_path.clone());
                    image_count = files.len();
                }
                Some("json") => {
                    metadata_folder_path = Some(subfolder_path.clone());
                    metadata_count = files.len();
                }
                _ => continue,
            }
        }

        if images_folder_path.is_some() && metadata_folder_path.is_some() {
            break;
        }
    }

    // Vérifier que les deux dossiers requis ont été trouvés
    if images_folder_path.is_none() || metadata_folder_path.is_none() {
        return Ok(ValidationResult {
            is_valid: false,
            error_message: Some(
                "The folder must contain one subfolder with images and another with JSON files."
                    .into(),
            ),
        });
    }

    // Vérifier que le nombre de fichiers correspond
    if image_count != metadata_count {
        return Ok(ValidationResult {
            is_valid: false,
            error_message: Some(
                "The number of files in the images folder and metadata folder must be the same."
                    .into(),
            ),
        });
    }

    // Vérifier les extensions des fichiers images
    let images_folder = images_folder_path.unwrap();
    let mut image_files = fs::read_dir(images_folder)
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok);
    let valid_image_extensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm"];
    let all_images_valid = image_files.all(|file| {
        let extension = file
            .path()
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| format!(".{}", ext.to_lowercase()));
        extension.map_or(false, |ext| valid_image_extensions.contains(&ext.as_str()))
    });

    if !all_images_valid {
        return Ok(ValidationResult {
            is_valid: false,
            error_message: Some("All files in the images folder must be valid image files (png, jpg, jpeg, webp, gif, mp4, webm).".into()),
        });
    }

    // Vérifier les extensions des fichiers metadata
    let metadata_folder = metadata_folder_path.unwrap();
    let mut metadata_files = fs::read_dir(metadata_folder)
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok);

    let all_metadata_valid = metadata_files.all(|file| {
        file.path()
            .extension()
            .and_then(|ext| ext.to_str())
            .map_or(false, |ext| ext.to_lowercase() == "json")
    });

    if !all_metadata_valid {
        return Ok(ValidationResult {
            is_valid: false,
            error_message: Some("All files in the metadata folder must be JSON files.".into()),
        });
    }

    // Tout est valide
    Ok(ValidationResult {
        is_valid: true,
        error_message: None,
    })
}

#[tauri::command]
pub async fn mix_legendary_nfts(
    legendary_folder: String,
    export_folder: String,
) -> Result<MixingResult, String> {
    let legendary_path = Path::new(&legendary_folder);
    let export_path = Path::new(&export_folder);

    match async {
        let (legendary_images_folder, legendary_metadata_folder) =
            find_image_and_metadata_folders(legendary_path)
                .await
                .map_err(|e| e.to_string())?;
        
        let (export_images_folder, export_metadata_folder) =
            find_image_and_metadata_folders(export_path)
                .await
                .map_err(|e| e.to_string())?;

        let legendary_image_files = fs::read_dir(&legendary_images_folder)
            .map_err(|e| format!("Failed to read legendary images folder: {}", e))?
            .filter_map(Result::ok)
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect::<Vec<_>>();

        let legendary_metadata_files = fs::read_dir(&legendary_metadata_folder)
            .map_err(|e| format!("Failed to read legendary metadata folder: {}", e))?
            .filter_map(Result::ok)
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect::<Vec<_>>();

        let global_metadata_path = export_metadata_folder.join("_metadata.json");
        if !global_metadata_path.exists() {
            return Err("_metadata.json not found in the export metadata folder.".into());
        }

        let global_metadata: GlobalMetadata = serde_json::from_str(
            &fs::read_to_string(&global_metadata_path)
                .map_err(|e| format!("Failed to read _metadata.json: {}", e))?
        ).map_err(|e| format!("Failed to parse _metadata.json: {}", e))?;

        let existing_image_files = fs::read_dir(&export_images_folder)
            .map_err(|e| format!("Failed to read export images folder: {}", e))?
            .filter_map(Result::ok)
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect::<Vec<_>>();

        let existing_metadata_files = fs::read_dir(&export_metadata_folder)
            .map_err(|e| format!("Failed to read export metadata folder: {}", e))?
            .filter_map(Result::ok)
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|name| name != "_metadata.json")
            .collect::<Vec<_>>();

        let mut indices: Vec<usize> = (0..existing_image_files.len()).collect();
        shuffle_array(&mut indices);

        let mut legendary_indices = Vec::new();
        let mut updated_global_metadata = global_metadata;

        for (i, (legendary_image_file, legendary_metadata_file)) in 
            legendary_image_files.iter().zip(legendary_metadata_files.iter()).enumerate() {
            
            let random_index = indices[i % indices.len()];
            
            if let (Some(existing_image_file), Some(existing_metadata_file)) = (
                existing_image_files.get(random_index),
                existing_metadata_files.get(random_index)
            ) {
                let existing_metadata_path = export_metadata_folder.join(existing_metadata_file);
                let existing_metadata: NFTMetadata = serde_json::from_str(
                    &fs::read_to_string(&existing_metadata_path)
                        .map_err(|e| format!("Failed to read existing metadata: {}", e))?
                ).map_err(|e| format!("Failed to parse existing metadata: {}", e))?;

                let existing_name = existing_metadata.name.clone();

                // Supprimer les fichiers existants
                fs::remove_file(export_images_folder.join(existing_image_file))
                    .map_err(|e| format!("Failed to remove existing image: {}", e))?;
                fs::remove_file(&existing_metadata_path)
                    .map_err(|e| format!("Failed to remove existing metadata: {}", e))?;

                // Copier les nouveaux fichiers
                fs::copy(
                    legendary_images_folder.join(legendary_image_file),
                    export_images_folder.join(existing_image_file)
                ).map_err(|e| format!("Failed to copy legendary image: {}", e))?;

                fs::copy(
                    legendary_metadata_folder.join(legendary_metadata_file),
                    &existing_metadata_path
                ).map_err(|e| format!("Failed to copy legendary metadata: {}", e))?;

                // Mettre à jour les métadonnées
                let mut legendary_metadata: NFTMetadata = serde_json::from_str(
                    &fs::read_to_string(&existing_metadata_path)
                        .map_err(|e| format!("Failed to read new metadata: {}", e))?
                ).map_err(|e| format!("Failed to parse new metadata: {}", e))?;

                legendary_metadata.image = existing_image_file.to_string();
                legendary_metadata.name = existing_name;

                fs::write(
                    &existing_metadata_path,
                    serde_json::to_string_pretty(&legendary_metadata)
                        .map_err(|e| format!("Failed to serialize metadata: {}", e))?
                ).map_err(|e| format!("Failed to write updated metadata: {}", e))?;

                updated_global_metadata.items[random_index] = legendary_metadata.clone();
                legendary_indices.push(random_index);
            }
        }

        fs::write(
            &global_metadata_path,
            serde_json::to_string_pretty(&updated_global_metadata)
                .map_err(|e| format!("Failed to serialize global metadata: {}", e))?
        ).map_err(|e| format!("Failed to write updated global metadata: {}", e))?;

        create_legendary_nfts_list(&legendary_indices, &updated_global_metadata, export_path)
            .await
            .map_err(|e| e.to_string())?;

        Ok(MixingResult {
            success: true,
            message: "The legendary NFTs have been mixed with the collection successfully. CSV and XLSX files have been created in the \"collection infos/legendary\" folder.".into(),
        })
    }.await {
        Ok(result) => Ok(result),
        Err(e) => Ok(MixingResult {
            success: false,
            message: e,
        }),
    }
}

async fn create_legendary_nfts_list(
    legendary_indices: &[usize],
    metadata: &GlobalMetadata,
    export_path: &Path,
) -> Result<(), String> {
    let infos_folder = export_path.join("collection infos").join("legendary");
    fs::create_dir_all(&infos_folder)
        .map_err(|e| format!("Failed to create legendary infos folder: {}", e))?;

    // Create CSV file
    let csv_path = infos_folder.join("legendary_nfts.csv");
    let mut csv_content = String::from("Index,Name,Image\n");

    for &index in legendary_indices {
        if let Some(nft) = metadata.items.get(index) {
            csv_content.push_str(&format!("{},{},{}\n", index + 1, nft.name, nft.image));
        }
    }

    fs::write(&csv_path, csv_content).map_err(|e| format!("Failed to write CSV file: {}", e))?;

    // Create XLSX file (if you need Excel format)
    // You might want to use a crate like `xlsxwriter` for this

    Ok(())
}
