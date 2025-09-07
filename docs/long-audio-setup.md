# Long Audio Transcription Setup Guide

## Overview

Audio Journal PWA now supports transcribing audio files longer than 1 minute using two different approaches:

1. **Chunked Transcription** (API Key) - Splits long audio into smaller chunks
2. **Long-Running Recognition** (Service Account) - Uses Google Cloud Storage for optimal results

## Quick Start (API Key Method)

If you're using an API key, the app will automatically use chunked transcription for audio longer than 60 seconds. No additional setup required!

### How It Works
- Audio is split into 50-second chunks with 5-second overlap
- Each chunk is transcribed separately using the standard Speech API
- Results are combined into a single transcript
- Progress is shown throughout the process

### Limitations
- Slightly lower accuracy at chunk boundaries
- May miss context between chunks
- Takes longer than Long-Running Recognition

## Advanced Setup (Service Account Method)

For best results with long audio files, use a Google Cloud Service Account:

### Prerequisites
1. Google Cloud Project with billing enabled
2. Speech-to-Text API enabled
3. Cloud Storage API enabled
4. Service Account with appropriate permissions

### Step 1: Create Google Cloud Storage Bucket

```bash
# Using gcloud CLI
gsutil mb gs://audiomind-temp-storage

# Set lifecycle policy to auto-delete files after 1 day
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 1}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://audiomind-temp-storage
```

### Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create audiomind-service \
    --display-name="AudioMind Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:audiomind-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/speech.editor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:audiomind-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create and download key
gcloud iam service-accounts keys create audiomind-key.json \
    --iam-account=audiomind-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 3: Configure AudioMind

1. Go to Settings in AudioMind
2. Switch from "API Key" to "Service Account" authentication
3. Upload your `audiomind-key.json` file
4. Update the bucket name in the code if you used a different name

### Step 4: Update Bucket Name (if needed)

If you used a different bucket name, update it in the code:

```typescript
// In src/lib/google-speech.ts, line ~420
const bucketName = 'your-custom-bucket-name'
```

## Supported Audio Formats

### For Chunked Transcription (API Key)
- WebM with Opus codec (recommended)
- WAV (LINEAR16)
- FLAC
- MP3 (converted to LINEAR16)

### For Long-Running Recognition (Service Account)
- All formats supported by Google Speech-to-Text API
- Optimal: FLAC or LINEAR16 WAV
- Maximum file size: 1GB
- Maximum duration: 480 minutes (8 hours)

## Performance Comparison

| Method | Max Duration | Accuracy | Speed | Setup Complexity |
|--------|-------------|----------|-------|------------------|
| Chunked (API Key) | 4 hours* | Good | Moderate | None |
| Long-Running (Service Account) | 8 hours | Excellent | Fast | Medium |

*Practical limit due to processing time

## Troubleshooting

### Common Issues

#### "Long audio transcription requires Service Account authentication"
- You're trying to use Long-Running Recognition with an API key
- Switch to chunked transcription or set up a Service Account

#### "Failed to upload to GCS"
- Check your Service Account permissions
- Verify the bucket exists and is accessible
- Ensure Cloud Storage API is enabled

#### "No successful chunk transcriptions"
- Audio file may be corrupted
- Check audio format compatibility
- Verify API key is valid and has quota

#### Chunked transcription is slow
- This is normal for very long files
- Consider using Service Account method for better performance
- Break very long recordings into shorter segments

### Performance Tips

1. **Use WebM/Opus format** for best compression and compatibility
2. **Record in segments** for easier processing (30-60 minutes max)
3. **Use Service Account** for files longer than 5 minutes
4. **Check your internet connection** for upload-heavy operations

## Cost Considerations

### API Key Method (Chunked)
- Charged per chunk (50-second segments)
- More API calls = higher cost
- Example: 10-minute audio = ~12 API calls

### Service Account Method
- Single Long-Running Recognition charge
- Plus Cloud Storage costs (minimal)
- More cost-effective for long files

### Cost Optimization
- Use chunked method for files under 5 minutes
- Use Long-Running Recognition for longer files
- Set up lifecycle policies to auto-delete temporary files
- Monitor usage in Google Cloud Console

## Security Notes

- Service Account keys contain sensitive credentials
- Store keys securely and never commit to version control
- Use IAM roles with minimal required permissions
- Regularly rotate Service Account keys
- Consider using Application Default Credentials in production

## API Limits

### Speech-to-Text API
- Sync requests: 60 seconds max
- Long-Running Recognition: 480 minutes max
- Rate limits apply (check Google Cloud Console)

### Cloud Storage
- Upload size: 5TB max per object
- Request rate limits apply
- Consider regional buckets for better performance

## Next Steps

1. Test with a short audio file first
2. Monitor costs in Google Cloud Console
3. Set up billing alerts
4. Consider implementing audio preprocessing for better results
5. Explore additional Speech-to-Text features (speaker diarization, etc.)

For more information, see:
- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [AudioMind API Integration Guide](./api-integration.md)
