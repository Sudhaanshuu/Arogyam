# 📦 Step 10: Storage Buckets Setup Guide

## ⚠️ Important: Buckets Must Be Created in Dashboard

Storage buckets **cannot** be created via SQL Editor. You must create them through the Supabase Dashboard UI.

---

## 📋 Storage Buckets to Create

You need to create **6 buckets** total:

### ✅ Public Buckets (4)
1. **doctor-profiles** - Doctor profile pictures
2. **user-profiles** - User profile pictures
3. **medicine-images** - Medicine product images
4. **news-images** - News article images

### 🔒 Private Buckets (2)
5. **prescriptions** - Prescription documents
6. **medical-reports** - Patient medical reports

---

## 🎯 How to Create Storage Buckets

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your Arogyam project

2. **Navigate to Storage**
   - Click on **"Storage"** in the left sidebar
   - You'll see the Storage overview page

3. **Create Each Bucket**
   
   For each bucket, do the following:

   #### a) Click "New bucket" button (top right)
   
   #### b) Fill in the form:
   
   **For Public Buckets** (doctor-profiles, user-profiles, medicine-images, news-images):
   - **Name:** Enter the bucket name exactly as shown
   - **Public bucket:** ✅ **Check this box**
   - Click **"Create bucket"**
   
   **For Private Buckets** (prescriptions, medical-reports):
   - **Name:** Enter the bucket name exactly as shown
   - **Public bucket:** ❌ **Leave this unchecked**
   - Click **"Create bucket"**

4. **Repeat for all 6 buckets**

---

## 📸 Visual Guide

### Creating a Public Bucket (e.g., doctor-profiles):

```
┌─────────────────────────────────────────┐
│  Create a new bucket                    │
├─────────────────────────────────────────┤
│                                         │
│  Name: doctor-profiles                  │
│  [________________________]             │
│                                         │
│  ☑ Public bucket                        │
│  Make all files in this bucket public   │
│                                         │
│  [Cancel]  [Create bucket]              │
└─────────────────────────────────────────┘
```

### Creating a Private Bucket (e.g., prescriptions):

```
┌─────────────────────────────────────────┐
│  Create a new bucket                    │
├─────────────────────────────────────────┤
│                                         │
│  Name: prescriptions                    │
│  [________________________]             │
│                                         │
│  ☐ Public bucket                        │
│  Make all files in this bucket public   │
│                                         │
│  [Cancel]  [Create bucket]              │
└─────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After creating all buckets, verify:

- [ ] **doctor-profiles** (Public) ✅
- [ ] **user-profiles** (Public) ✅
- [ ] **medicine-images** (Public) ✅
- [ ] **news-images** (Public) ✅
- [ ] **prescriptions** (Private) 🔒
- [ ] **medical-reports** (Private) 🔒

You should see all 6 buckets listed in the Storage page.

---

## 🔐 After Creating Buckets

### Optional: Run Storage Policies

After creating all buckets, you can **optionally** run the storage policies from `step_10_setup_storage.sql` in the SQL Editor.

**Note:** The default policies created with the buckets should work fine for most cases. The additional policies in the SQL file provide more granular control.

If you want to run them:
1. Go to **SQL Editor**
2. Open `step_10_setup_storage.sql`
3. Run the policy section (everything after the "CREATE BUCKETS" comments)

---

## 🎨 What Each Bucket Is For

### doctor-profiles (Public)
- Stores doctor profile photos
- Accessible to anyone (for doctor listings)
- Upload: Doctors only
- View: Everyone

### user-profiles (Public)
- Stores user/patient profile photos
- Accessible to anyone
- Upload: Users only (their own)
- View: Everyone

### medicine-images (Public)
- Stores medicine product images
- Accessible to anyone (for catalog)
- Upload: Admin/system
- View: Everyone

### news-images (Public)
- Stores news article featured images
- Accessible to anyone
- Upload: Admin/content creators
- View: Everyone

### prescriptions (Private)
- Stores prescription PDFs/documents
- Private - only accessible to patient/doctor
- Upload: Doctors only
- View: Patient and prescribing doctor only

### medical-reports (Private)
- Stores patient medical reports, test results
- Private - only accessible to patient
- Upload: Patients and doctors
- View: Patient only

---

## 🚫 Common Errors and Solutions

### Error: "Bucket name already exists"
**Solution:** The bucket is already created. Move to the next one.

### Error: "Failed to create bucket"
**Solution:** 
- Check your project permissions
- Make sure you're in the correct project
- Try refreshing the page and creating again

### Error: "Must be owner of table buckets" (when running SQL)
**Solution:** This is normal. Buckets can only be created via Dashboard, not SQL.

---

## 📂 File Organization in Buckets

### Recommended folder structure:

```
doctor-profiles/
  └── {user_id}/
      └── profile.jpg

user-profiles/
  └── {user_id}/
      └── avatar.jpg

medicine-images/
  └── {medicine_id}/
      └── product.jpg

news-images/
  └── {news_id}/
      └── featured.jpg

prescriptions/
  └── {patient_id}/
      └── {prescription_id}.pdf

medical-reports/
  └── {patient_id}/
      └── {report_id}.pdf
```

This structure is enforced by the RLS policies.

---

## 🔧 How to Upload Files (In Your App)

Once buckets are created, use this code pattern:

```typescript
import { supabase } from './lib/supabase';

// Upload a file
const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
    
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  
  // Get public URL (for public buckets)
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return urlData.publicUrl;
};

// Example: Upload user profile picture
const file = event.target.files[0];
const userId = user.id;
const filePath = `${userId}/avatar.jpg`;
const imageUrl = await uploadFile('user-profiles', filePath, file);
```

---

## 📊 Storage Limits

### Supabase Free Tier:
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **File uploads:** Up to 50 MB per file

### If you need more:
- Upgrade to Pro plan ($25/month)
- **Storage:** 100 GB included
- **Bandwidth:** 200 GB included
- Larger file uploads supported

---

## ✅ Next Steps

After creating all 6 buckets:

1. ✅ Verify all buckets appear in Storage dashboard
2. ✅ Check public/private settings are correct
3. ✅ (Optional) Run storage policies from SQL file
4. ✅ Test file upload in your application
5. ✅ Move on to testing your application!

---

## 🎉 That's It!

Your storage setup is complete once all 6 buckets are created.

**Next:** Test your application by uploading a profile picture!

---

**Questions?**
- Check Supabase Storage docs: https://supabase.com/docs/guides/storage
- Review storage policies in `step_10_setup_storage.sql`
- Test uploads with sample files first
