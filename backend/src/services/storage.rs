use object_store::aws::{AmazonS3, AmazonS3Builder};

pub const MAX_FILE_BYTES: usize = 10 * 1024 * 1024;

pub fn configure() -> Result<Option<AmazonS3>, Box<dyn std::error::Error>> {
    let access_key = std::env::var("R2_ACCESS_KEY_ID")
        .ok()
        .filter(|key| !key.is_empty());
    let secret_key = std::env::var("R2_SECRET_ACCESS_KEY")
        .ok()
        .filter(|key| !key.is_empty());
    match (access_key, secret_key) {
        (None, None) => Ok(None),
        (Some(access_key), Some(secret_key)) => Ok(Some(
            AmazonS3Builder::new()
                .with_endpoint("https://1b6cab265b908c71f1eedfde3ba41cc9.r2.cloudflarestorage.com")
                .with_bucket_name("carni")
                .with_virtual_hosted_style_request(false)
                .with_region("auto")
                .with_access_key_id(access_key)
                .with_secret_access_key(secret_key)
                .build()?,
        )),
        _ => Err("Set both R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY".into()),
    }
}
