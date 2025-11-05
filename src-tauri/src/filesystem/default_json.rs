#[tauri::command]
pub fn get_default_json_content(filename: &str) -> String {
    match filename {
        "project_setup.json" => r#"{
            "collectionName": "",
            "collectionDescription": "",
            "selectedFolder": "",
            "exportFolder": "",
            "includeRarity": true,
            "maxFrames": 0,
            "isAnimatedCollection": false,
            "spritesheetLayout": null
        }"#
        .to_string(),
        "ordered_layers.json" => r#"{
            "sets": {
                "set1": {
                    "id": "set1",
                    "name": "Set 1",
                    "customName": "Set 1",
                    "createdAt": "2023-01-01T00:00:00Z",
                    "layers": [],
                    "nftCount": 10
                }
            },
            "activeSetId": "set1",
            "setOrders": [
                {
                    "id": "set1",
                    "order": 0
                }
            ]
        }"#
        .to_string(),
        "rarity_config.json" => r#"{
            "rarityConfigStorage": {}
        }"#
        .to_string(),
        "incompatibility.json" => r#"{
            "incompatibilities": {}
        }"#
        .to_string(),
        "forced_combination.json" => r#"{
            "forcedCombinations": {}
        }"#
        .to_string(),
        "filter_config.json" => r#"{
            "filterConfigStorage": {
                "sourceFolder": "",
                "destinationFolder": "",
                "hasUserSelectedFolders": false,
                "flipOptions": {
                    "horizontalFlipPercentage": 0,
                    "verticalFlipPercentage": 0,
                    "includeInMetadata": true
                },
                "tintingOptions": {
                    "includeFilterInMetadata": true,
                    "pipelines": [
                        {
                            "id": "default_pipeline",
                            "name": "Pipeline 1",
                            "effects": [],
                            "distributionPercentage": 100
                        }
                    ],
                    "activePipelineId": "default_pipeline"
                },
                "selectedPaletteName": "",
                "lastAdjustmentMade": false,
                "exportFormat": "png",
                "isAnimated": false
            },
            "pipelines": []
        }"#
        .to_string(),
        "image_setup.json" => r#"{
            "imageFormat": "png",
            "baseWidth": 0,
            "baseHeight": 0,
            "finalWidth": 512,
            "finalHeight": 512,
            "fixedProportion": true,
            "includeSpritesheets": false,
            "allowDuplicates": false,
            "shuffleSets": false,
            "blockchain": "eth",
            "solanaConfig": null
        }"#
        .to_string(),
        "other_parameters.json" => r#"{
            "hash": {},
            "lastCreatedCollection": ""
        }"#
        .to_string(),
        "global_rarity.json" => r#"{}"#.to_string(),
        _ => "{}".to_string(),
    }
}
