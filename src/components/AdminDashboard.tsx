import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  Grid,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  Check,
  Briefcase,
  Sliders,
  Maximize2,
  FolderOpen,
  CheckCircle,
  Home,
  Tag,
  Upload,
  Image,
  Lock,
  AlertCircle,
  Video,
  Link,
  Database,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  HardDrive
} from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import { formatSqft } from '../utils/sqft';
import { isPlanTrending, isPlanMostViewed } from './Ribbon';
import { getEmbedVideoUrl, isEmbedVideo, isDataVideo } from '../utils/video';
import { uploadMediaToStorage, clearAllPlansFromFirestore, getStoredInquiries, publishPlansToGitHubApi, blobToDataUrl } from '../lib/firebase';
import { 
  testSupabaseConnection, 
  syncCatalogToSupabase, 
  isSupabaseConfigured, 
  uploadToSupabaseStorage, 
  getSupabaseClient 
} from '../lib/supabase';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ArchitecturalPlan[];
  onAddPlan: (plan: ArchitecturalPlan) => void;
  onUpdatePlan: (plan: ArchitecturalPlan) => void;
  onDeletePlan: (id: string) => void;
  onClearAllPlans?: () => Promise<void>;
}

const ALL_CATEGORIES = [
  'Residential',
  'Hospitality',
  'Commercial',
  'Industrial',
  'Educational',
  'Healthcare',
  'Government'
];

// Aesthetic architectural placeholder images
const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
];

const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.65): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function AdminDashboard({
  isOpen,
  onClose,
  plans,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onClearAllPlans
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'inquiries' | 'cloud'>('list');
  const [editingPlan, setEditingPlan] = useState<ArchitecturalPlan | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);

  // Supabase Cloud State
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{
    tested: boolean;
    loading: boolean;
    configured: boolean;
    tableOk: boolean;
    tableCount: number;
    storageOk: boolean;
    storageFilesCount: number;
    errorMessage?: string;
  }>({
    tested: false,
    loading: false,
    configured: isSupabaseConfigured(),
    tableOk: false,
    tableCount: 0,
    storageOk: false,
    storageFilesCount: 0
  });

  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseSyncProgress, setSupabaseSyncProgress] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [testUploadUrl, setTestUploadUrl] = useState<string>('');
  const [isTestUploading, setIsTestUploading] = useState(false);

  const handleTestSupabase = async () => {
    setSupabaseTestStatus((prev) => ({ ...prev, loading: true, errorMessage: undefined }));
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestStatus({
        tested: true,
        loading: false,
        configured: res.configured,
        tableOk: res.tableOk,
        tableCount: res.tableCount,
        storageOk: res.storageOk,
        storageFilesCount: res.storageFilesCount,
        errorMessage: res.errorMessage
      });
    } catch (err: any) {
      setSupabaseTestStatus((prev) => ({
        ...prev,
        tested: true,
        loading: false,
        errorMessage: err?.message || String(err)
      }));
    }
  };

  const handleSyncAllToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase is not configured yet. Check credentials in .env.");
      return;
    }
    setIsSyncingSupabase(true);
    setSupabaseSyncProgress(`Starting sync of ${plans.length} designs to Supabase...`);

    try {
      const result = await syncCatalogToSupabase(plans, (current, total, msg) => {
        setSupabaseSyncProgress(`[${current}/${total}] ${msg}`);
      });

      if (result.errorCount === 0) {
        setSuccessMsg(`Successfully pushed all ${result.successCount} designs to Supabase!`);
      } else {
        setSuccessMsg(`Synced ${result.successCount} designs. ${result.errorCount} failed. Check table RLS policy.`);
      }

      // Re-run test connection to update counts
      await handleTestSupabase();
    } catch (err: any) {
      alert("Sync error: " + (err?.message || err));
    } finally {
      setIsSyncingSupabase(false);
      setSupabaseSyncProgress('');
    }
  };

  const handleUploadTestImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsTestUploading(true);
      setTestUploadUrl('');
      try {
        const url = await uploadToSupabaseStorage(file, 'test_upload');
        if (url) {
          setTestUploadUrl(url);
          setSuccessMsg('Test image uploaded directly to Supabase storage bucket!');
          await handleTestSupabase();
        } else {
          alert('Upload failed. Please ensure bucket "projects" is created in Supabase Storage and set to Public with insert policy.');
        }
      } catch (err: any) {
        alert('Upload exception: ' + (err?.message || err));
      } finally {
        setIsTestUploading(false);
      }
    }
  };

  const copySqlScript = () => {
    const sql = `-- ==========================================
-- 1. Create the projects table in Supabase
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  sqft NUMERIC DEFAULT 0,
  beds NUMERIC DEFAULT 0,
  baths NUMERIC DEFAULT 0,
  stories NUMERIC DEFAULT 1,
  garage_bays NUMERIC DEFAULT 0,
  width TEXT,
  depth TEXT,
  style TEXT,
  category TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  floors JSONB DEFAULT '[]'::jsonb,
  is_trending BOOLEAN DEFAULT false,
  is_most_viewed BOOLEAN DEFAULT false,
  project_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security & Public Access
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.projects;
CREATE POLICY "Allow public read access" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write access" ON public.projects;
CREATE POLICY "Allow public write access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- ==========================================
-- 2. Create Storage Bucket 'projects' & Access Policies
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
CREATE POLICY "Public Storage Access" ON storage.objects FOR SELECT USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
CREATE POLICY "Public Storage Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'projects');

DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;
CREATE POLICY "Public Storage Delete" ON storage.objects FOR DELETE USING (bucket_id = 'projects');`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSyncToGithub = async () => {
    setIsSyncingGithub(true);
    setSuccessMsg('Publishing latest catalog changes live...');
    try {
      const res = await publishPlansToGitHubApi(plans);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: any) {
      alert('Publish notice: ' + (err.message || 'Updated locally.'));
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('oren_admin_authenticated') === 'true' ||
           sessionStorage.getItem('oren_admin_authenticated') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim().toLowerCase() === 'admin@orendesignandbuild.com' && loginPassword === '@orendesign') {
      setIsAuthenticated(true);
      localStorage.setItem('oren_admin_authenticated', 'true');
      sessionStorage.setItem('oren_admin_authenticated', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
    }
  }, [isOpen]);

  // Form States
  const [name, setName] = useState('');
  const [projectNo, setProjectNo] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sqft, setSqft] = useState('');
  const [beds, setBeds] = useState('3');
  const [baths, setBaths] = useState('2');
  const [stories, setStories] = useState('1');
  const [garageBays, setGarageBays] = useState('2');
  const [width, setWidth] = useState("45'-0\"");
  const [depth, setDepth] = useState("50'-0\"");
  const [style, setStyle] = useState('Modern Minimalist');
  const [category, setCategory] = useState('Residential');
  const [image, setImage] = useState(PRESET_IMAGES[0]);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [activeUploadsCount, setActiveUploadsCount] = useState(0);
  const [features, setFeatures] = useState<string[]>(['Smart home automation ready', 'Passive solar insulation layouts']);
  const [newFeature, setNewFeature] = useState('');
  const [ceilingHeights, setCeilingHeights] = useState("10' Main, 9' Upper");
  const [roofPitch, setRoofPitch] = useState('4:12');
  const [framingType, setFramingType] = useState('2x6 Wood Framing');
  const [isTrending, setIsTrending] = useState(false);
  const [isMostViewed, setIsMostViewed] = useState(false);

  // Auto-restore form draft if available on page load/mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('oren_admin_form_draft');
      if (savedDraft && !editingPlan) {
        const draft = JSON.parse(savedDraft);
        if (draft.name) setName(draft.name);
        if (draft.projectNo) setProjectNo(draft.projectNo);
        if (draft.subtitle) setSubtitle(draft.subtitle);
        if (draft.description) setDescription(draft.description);
        if (draft.price) setPrice(draft.price);
        if (draft.sqft) setSqft(draft.sqft);
        if (draft.beds) setBeds(draft.beds);
        if (draft.baths) setBaths(draft.baths);
        if (draft.stories) setStories(draft.stories);
        if (draft.garageBays) setGarageBays(draft.garageBays);
        if (draft.width) setWidth(draft.width);
        if (draft.depth) setDepth(draft.depth);
        if (draft.style) setStyle(draft.style);
        if (draft.category) setCategory(draft.category);
        if (draft.image) setImage(draft.image);
        if (draft.images && Array.isArray(draft.images) && draft.images.length > 0) setImages(draft.images);
        if (draft.videos && Array.isArray(draft.videos) && draft.videos.length > 0) setVideos(draft.videos);
        if (draft.features && Array.isArray(draft.features) && draft.features.length > 0) setFeatures(draft.features);
        if (draft.ceilingHeights) setCeilingHeights(draft.ceilingHeights);
        if (draft.roofPitch) setRoofPitch(draft.roofPitch);
        if (draft.framingType) setFramingType(draft.framingType);
        if (draft.isTrending !== undefined) setIsTrending(draft.isTrending);
        if (draft.isMostViewed !== undefined) setIsMostViewed(draft.isMostViewed);
      }
    } catch (e) {
      console.warn("Could not restore admin form draft:", e);
    }
  }, []);

  // Auto-persist form draft as admin types/edits so changes survive page reloads
  useEffect(() => {
    if (!editingPlan && (name || projectNo || description || price || images.length > 0 || videos.length > 0)) {
      const draftData = {
        name, projectNo, subtitle, description, price, sqft, beds, baths, stories,
        garageBays, width, depth, style, category, image, images, videos, features,
        ceilingHeights, roofPitch, framingType, isTrending, isMostViewed
      };
      try {
        localStorage.setItem('oren_admin_form_draft', JSON.stringify(draftData));
      } catch (e) {
        console.warn("Failed to persist draft form:", e);
      }
    }
  }, [name, projectNo, subtitle, description, price, sqft, beds, baths, stories, garageBays, width, depth, style, category, image, images, videos, features, ceilingHeights, roofPitch, framingType, isTrending, isMostViewed, editingPlan]);

  const clearFormDraft = () => {
    try {
      localStorage.removeItem('oren_admin_form_draft');
    } catch (e) {}
  };

  // Filter States for Admin List
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterMarketing, setFilterMarketing] = useState<'All' | 'Trending' | 'MostViewed'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleMultipleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = (Array.from(e.target.files) as File[]).filter((f) => f.type.startsWith('image/'));
      if (filesArray.length === 0) return;

      // 1. Create instant zero-latency object URLs for all files immediately
      const tempItems = filesArray.map((file) => ({
        file,
        tempUrl: URL.createObjectURL(file)
      }));

      // Add all preview URLs to component state synchronously so they appear in UI <10ms
      setImages((prev) => [...prev, ...tempItems.map((item) => item.tempUrl)]);

      setIsImageUploading(true);
      setImageUploadProgress(5);

      let completedCount = 0;

      // 2. Upload all images concurrently in parallel for snappy sub-second performance
      try {
        await Promise.all(
          tempItems.map(async ({ file, tempUrl }) => {
            try {
              const downloadURL = await uploadMediaToStorage(file, 'images', (progress) => {
                // Update overall progress
                setImageUploadProgress((prevProg) => Math.max(prevProg || 0, Math.round(progress)));
              });

              completedCount++;
              setImageUploadProgress(Math.round((completedCount / tempItems.length) * 100));

              // Swap out tempUrl with uploaded data URL
              setImages((prev) => {
                return prev.map((img) => (img === tempUrl ? downloadURL : img));
              });

              setImage((currentCover) => {
                if (!currentCover || PRESET_IMAGES.includes(currentCover) || currentCover.startsWith('blob:')) {
                  return downloadURL;
                }
                return currentCover;
              });
            } catch (err) {
              console.error("Single image upload failed:", err);
            }
          })
        );
      } catch (err) {
        console.error("Image upload failed:", err);
      } finally {
        setIsImageUploading(false);
        setImageUploadProgress(null);
      }
      e.target.value = '';
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    const tempUrl = URL.createObjectURL(file);
    setImage(tempUrl);

    setIsImageUploading(true);
    setImageUploadProgress(0);

    try {
      const downloadURL = await uploadMediaToStorage(file, 'images', (progress) => {
        setImageUploadProgress(progress);
      });

      setImage(downloadURL);
      setImages((prev) => {
        return [downloadURL, ...prev.filter((im) => im !== tempUrl)];
      });
    } catch (err) {
      console.error("Error uploading cover image:", err);
      alert("Cover image upload failed.");
    } finally {
      setIsImageUploading(false);
      setImageUploadProgress(null);
    }
  };

  // Load inquiries from localStorage
  const [inquiries, setInquiries] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve(getStoredInquiries()).then(res => setInquiries(res || []));
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setProjectNo('');
    setSubtitle('');
    setDescription('');
    setPrice('');
    setSqft('');
    setBeds('3');
    setBaths('2');
    setStories('1');
    setGarageBays('2');
    setWidth("45'-0\"");
    setDepth("50'-0\"");
    setStyle('Modern Minimalist');
    setCategory('Residential');
    setImage(PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)]);
    setFeatures(['Smart home automation ready', 'Passive solar insulation layouts']);
    setCeilingHeights("10' Main, 9' Upper");
    setRoofPitch('4:12');
    setFramingType('2x6 Wood Framing');
    setIsTrending(false);
    setIsMostViewed(false);
    setImages([]);
    setVideos([]);
    setNewVideoUrl('');
    setActiveUploadsCount(0);
    setEditingPlan(null);
    clearFormDraft();
  };

  const handleEditClick = (plan: ArchitecturalPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setProjectNo(plan.projectNo || '');
    setSubtitle(plan.subtitle || '');
    setDescription(plan.description);
    setPrice(plan.price.toString());
    setSqft(plan.sqft.toString());
    setBeds(plan.beds.toString());
    setBaths(plan.baths.toString());
    setStories(plan.stories ? plan.stories.toString() : '1');
    setGarageBays(plan.garageBays ? plan.garageBays.toString() : '2');
    setWidth(plan.width);
    setDepth(plan.depth);
    setStyle(plan.style);
    setCategory(plan.category);
    setImage(plan.image);
    setFeatures(plan.features || []);
    setCeilingHeights(plan.ceilingHeights || "10' Main, 9' Upper");
    setRoofPitch(plan.roofPitch || '4:12');
    setFramingType(plan.framingType || '2x6 Wood Framing');
    setIsTrending(isPlanTrending(plan));
    setIsMostViewed(isPlanMostViewed(plan));
    setImages(plan.images && plan.images.length > 0 ? [...plan.images] : [plan.image]);
    setVideos(plan.videos && plan.videos.length > 0 ? [...plan.videos] : []);
    setNewVideoUrl('');
    setActiveTab('add');
  };

  const handleAddFeature = () => {
    if (newFeature.trim() !== '') {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !sqft) {
      alert('Please fill out Name, Price, and Square Footage.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure all blob URLs and data URLs are uploaded to server filesystem or compressed
      const resolveAndUploadImage = async (url: string): Promise<string> => {
        if (!url) return PRESET_IMAGES[0];
        if (url.startsWith('uploads/') || url.startsWith('/uploads/') || (url.startsWith('http') && !url.startsWith('data:'))) {
          return url.replace(/^\//, '');
        }
        try {
          if (url.startsWith('blob:') || url.startsWith('data:')) {
            const res = await fetch(url);
            const blob = await res.blob();
            const uploaded = await uploadMediaToStorage(blob, 'plans');
            return uploaded ? uploaded.replace(/^\//, '') : url;
          }
        } catch (e) {
          console.warn("Failed uploading image to server storage:", e);
        }
        return url;
      };

      const resolvedSingleImage = await resolveAndUploadImage(image);
      const rawImagesList = images.length > 0 ? images : (resolvedSingleImage ? [resolvedSingleImage] : []);
      const resolvedImagesList = await Promise.all(rawImagesList.map(resolveAndUploadImage));
      const coverImage = resolvedImagesList[0] || resolvedSingleImage || PRESET_IMAGES[0];

      const rawPlanData: ArchitecturalPlan = {
        id: editingPlan ? editingPlan.id : `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        projectNo: projectNo || '',
        subtitle: subtitle || `${beds} Bed, ${baths} Bath Modern Classic`,
        description,
        price: parseFloat(price),
        sqft: sqft as any, 
        beds: parseInt(beds),
        baths: parseFloat(baths),
        stories: parseInt(stories),
        garageBays: parseInt(garageBays),
        width,
        depth,
        style,
        category,
        image: coverImage,
        images: resolvedImagesList.length > 0 ? resolvedImagesList : [coverImage],
        videos: videos.length > 0 ? videos : [],
        features,
        ceilingHeights,
        roofPitch,
        framingType,
        isTrending,
        isMostViewed,
        floors: editingPlan?.floors || [
          {
            name: 'Ground Floor',
            rooms: [
              { id: '1', name: 'Grand Foyer', dimensions: "12' x 14'", x: 10, y: 15, width: 25, height: 20, description: 'Double height entrance' },
              { id: '2', name: 'Master Suite', dimensions: "16' x 20'", x: 40, y: 15, width: 35, height: 25, description: 'En suite bath and walk-in closet' },
              { id: '3', name: 'Great Room', dimensions: "24' x 18'", x: 10, y: 40, width: 55, height: 35, description: 'Central hearth and panoramic glazing' }
            ]
          }
        ]
      };

      if (editingPlan) {
        await onUpdatePlan(rawPlanData);
        clearFormDraft();
        setSuccessMsg('Blueprint updated & synced to all devices!');
        setTimeout(() => {
          setSuccessMsg('');
          setEditingPlan(null);
          resetForm();
          setActiveTab('list');
        }, 1500);
      } else {
        await onAddPlan(rawPlanData);
        clearFormDraft();
        setSuccessMsg('New blueprint added & published live to all devices!');
        setTimeout(() => {
          setSuccessMsg('');
          setEditingPlan(null);
          resetForm();
          setActiveTab('list');
        }, 1500);
      }
    } catch (err) {
      console.error("Error submitting plan:", err);
      alert("Notice: Plan saved locally in browser.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex justify-end items-stretch animate-fade-in" id="admin-dashboard-container">
      <div className="w-full bg-stone-900 text-stone-100 flex flex-col h-full shadow-2xl" id="admin-panel-content">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-850 flex justify-between items-center bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="bg-[#84e114]/10 p-2 rounded-xl text-[#84e114]">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-wide text-white uppercase">Oren Design Control</h2>
              <p className="text-[10px] font-mono text-[#84e114] uppercase tracking-widest font-semibold">Administrator Desk</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-850 rounded-full transition-all cursor-pointer focus:outline-none"
              id="close-admin-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isAuthenticated ? (
          <>
            {/* Tab Selection */}
        <div className="px-6 py-2 bg-stone-950/50 border-b border-stone-850 flex gap-4">
          <button
            onClick={() => { setActiveTab('list'); setEditingPlan(null); }}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-semibold border-b-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'list' ? 'border-[#84e114] text-[#84e114]' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Grid className="h-4 w-4" /> Catalog ({plans.length})
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('add'); resetForm(); }}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-semibold border-b-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'add' ? 'border-[#84e114] text-[#84e114]' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> {editingPlan ? 'Edit Blueprint' : 'Add Blueprint'}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-semibold border-b-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'inquiries' ? 'border-[#84e114] text-[#84e114]' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Custom Inquiries ({inquiries.length})
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('cloud'); handleTestSupabase(); }}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-semibold border-b-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'cloud' ? 'border-[#84e114] text-[#84e114]' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#84e114]" /> Supabase Cloud {isSupabaseConfigured() ? <span className="w-2 h-2 rounded-full bg-[#84e114] inline-block animate-pulse" /> : <span className="text-[10px] text-amber-400">(Setup)</span>}
            </span>
          </button>
        </div>

        {/* Feedback Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 bg-[#84e114]/10 border border-[#84e114] text-[#84e114] px-4 py-3 rounded-xl flex items-center gap-2.5 animate-pulse text-xs font-mono">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dynamic Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: LIST CATALOG */}
          {activeTab === 'list' && (() => {
            const filteredPlans = plans.filter((p) => {
              if (filterCategory !== 'All' && p.category !== filterCategory) return false;
              if (filterMarketing === 'Trending' && !isPlanTrending(p)) return false;
              if (filterMarketing === 'MostViewed' && !isPlanMostViewed(p)) return false;
              if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.style.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
              }
              return true;
            });

            return (
              <div className="space-y-4">
                {/* Interactive Filter and Search Suite */}
                <div className="bg-stone-950/60 p-4 border border-stone-850 rounded-xl space-y-3.5 text-left">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search blueprints by name, style, or details..."
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg pl-3.5 pr-8 py-2 text-xs text-white placeholder-stone-500 focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2 text-stone-500 hover:text-stone-300 text-xs focus:outline-none"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Category Dropdown Filter */}
                    <div className="w-full md:w-52">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] outline-none cursor-pointer"
                      >
                        <option value="All">All Categories / Divisions</option>
                        {ALL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat} Plans</option>
                        ))}
                      </select>
                    </div>

                    {/* Marketing Preset Dropdown */}
                    <div className="w-full md:w-52">
                      <select
                        value={filterMarketing}
                        onChange={(e) => setFilterMarketing(e.target.value as any)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] outline-none cursor-pointer"
                      >
                        <option value="All">All Promotional Tags</option>
                        <option value="Trending">Trending This Week</option>
                        <option value="MostViewed">Most Viewed Designs</option>
                      </select>
                    </div>
                  </div>

                  {/* Info & Reset Section */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 font-sans">
                    <div className="flex items-center gap-3">
                      <span>Showing <strong>{filteredPlans.length}</strong> of <strong>{plans.length}</strong> designs</span>
                      {(filterCategory !== 'All' || filterMarketing !== 'All' || searchQuery !== '') && (
                        <button
                          onClick={() => {
                            setFilterCategory('All');
                            setFilterMarketing('All');
                            setSearchQuery('');
                          }}
                          className="text-[#84e114] hover:underline focus:outline-none cursor-pointer font-bold uppercase text-[9px] tracking-wider"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {plans.length > 0 && (
                        <button
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to remove ALL projects from the database? You will then be able to add new projects manually.")) {
                              try {
                                if (onClearAllPlans) {
                                  await onClearAllPlans();
                                } else {
                                  await clearAllPlansFromFirestore();
                                }
                                try {
                                  localStorage.removeItem("oren_catalog_custom_blueprints");
                                } catch (e) {}
                                setSuccessMsg("All projects removed! The database is now empty for manual entry.");
                              } catch (err) {
                                console.error("Failed to clear database:", err);
                                alert("Error clearing projects from database.");
                              }
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3 w-3" /> Clear All Projects ({plans.length})
                        </button>
                      )}
                      <span className="text-[10px] text-stone-500 hidden sm:inline">
                        Toggle Trending or Most Viewed directly on each blueprint card below.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editorial & Promotions Quick Manager */}
                <div className="bg-stone-950/40 border border-stone-850 rounded-xl p-4 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-stone-850 pb-2">
                    <h3 className="text-xs font-mono font-bold text-[#84e114] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Editorial & Promotions Manager
                    </h3>
                    <span className="text-[10px] text-stone-500 font-sans">Quickly edit & remove featured homepage items</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Trending Column */}
                    <div className="space-y-2 bg-stone-900/60 p-3 rounded-lg border border-stone-850">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#84e114] animate-pulse" />
                          Trending This Week
                        </span>
                        <span className="text-[9px] font-mono text-stone-500 uppercase">{plans.filter(isPlanTrending).length} active</span>
                      </div>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {plans.filter(isPlanTrending).length === 0 ? (
                          <p className="text-[10px] text-stone-500 italic py-1">No items trending this week.</p>
                        ) : (
                          plans.filter(isPlanTrending).map((p) => (
                            <div key={`promo-trending-${p.id}`} className="flex items-center justify-between bg-stone-950/50 px-2 py-1.5 rounded border border-stone-850/60 hover:border-stone-800 transition-colors text-[11px]">
                              <span className="text-stone-300 font-medium truncate max-w-[180px]" title={p.name}>{p.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleEditClick(p)}
                                  className="text-stone-400 hover:text-white transition-colors cursor-pointer"
                                  title="Edit Blueprint Details"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdatePlan({
                                      ...p,
                                      isTrending: false
                                    });
                                  }}
                                  className="text-stone-400 hover:text-[#84e114] transition-colors cursor-pointer"
                                  title="Remove from Trending"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Most Viewed Column */}
                    <div className="space-y-2 bg-stone-900/60 p-3 rounded-lg border border-stone-850">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#84e114] animate-pulse" />
                          Most Viewed Designs
                        </span>
                        <span className="text-[9px] font-mono text-stone-500 uppercase">{plans.filter(isPlanMostViewed).length} active</span>
                      </div>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {plans.filter(isPlanMostViewed).length === 0 ? (
                          <p className="text-[10px] text-stone-500 italic py-1">No items most viewed.</p>
                        ) : (
                          plans.filter(isPlanMostViewed).map((p) => (
                            <div key={`promo-mostviewed-${p.id}`} className="flex items-center justify-between bg-stone-950/50 px-2 py-1.5 rounded border border-stone-850/60 hover:border-stone-800 transition-colors text-[11px]">
                              <span className="text-stone-300 font-medium truncate max-w-[180px]" title={p.name}>{p.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleEditClick(p)}
                                  className="text-stone-400 hover:text-white transition-colors cursor-pointer"
                                  title="Edit Blueprint Details"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdatePlan({
                                      ...p,
                                      isMostViewed: false
                                    });
                                  }}
                                  className="text-stone-400 hover:text-[#84e114] transition-colors cursor-pointer"
                                  title="Remove from Most Viewed"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs text-stone-400">Filtered design inventory:</span>
                  <button
                    onClick={() => { setActiveTab('add'); resetForm(); }}
                    className="bg-[#84e114] text-stone-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#72c310] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Design
                  </button>
                </div>

                {filteredPlans.length === 0 ? (
                  <div className="border border-dashed border-stone-850 rounded-xl p-12 text-center text-stone-500 text-xs">
                    No blueprints found matching current search and filtering criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {filteredPlans.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row bg-stone-950/40 border border-stone-850 rounded-xl p-3.5 gap-4 hover:border-stone-800 transition-colors"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="h-24 w-36 object-cover rounded-lg border border-stone-800 shrink-0 self-center sm:self-start"
                        />
                        <div className="flex-1 min-w-0 text-left flex flex-col justify-between">
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="bg-[#84e114]/10 border border-[#84e114]/20 text-[#84e114] text-[9px] px-2 py-0.5 rounded font-semibold uppercase">
                                {p.category}
                              </span>
                              <span className="text-stone-500 text-[10px]">{p.style}</span>
                            </div>
                            <h4 className="font-display font-bold text-sm text-white mt-1.5 flex items-center flex-wrap gap-2">
                              {p.name}
                              {p.projectNo && (
                                <span className="bg-stone-850 text-stone-300 font-mono text-[9px] px-2 py-0.5 rounded border border-stone-800">
                                  Project No: {p.projectNo}
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-stone-400 font-sans mt-0.5 truncate">{p.description}</p>
                          </div>

                          {/* Interactive Marketing / Promos Toggles */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdatePlan({
                                  ...p,
                                  isTrending: !isPlanTrending(p)
                                });
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                                isPlanTrending(p)
                                  ? 'bg-[#84e114]/20 text-[#84e114] border-[#84e114]/30 hover:bg-[#84e114]/30'
                                  : 'bg-stone-900 text-stone-500 border-stone-850 hover:text-stone-300 hover:border-stone-700'
                              }`}
                              title="Toggle Trending This Week status"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isPlanTrending(p) ? 'bg-[#84e114] animate-pulse' : 'bg-stone-700'}`} />
                              Trending
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onUpdatePlan({
                                  ...p,
                                  isMostViewed: !isPlanMostViewed(p)
                                });
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                                isPlanMostViewed(p)
                                  ? 'bg-[#84e114]/20 text-[#84e114] border-[#84e114]/30 hover:bg-[#84e114]/30'
                                  : 'bg-stone-900 text-stone-500 border-stone-850 hover:text-stone-300 hover:border-stone-700'
                              }`}
                              title="Toggle Most Viewed status"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isPlanMostViewed(p) ? 'bg-[#84e114] animate-pulse' : 'bg-stone-700'}`} />
                              Most Viewed
                            </button>
                          </div>

                          <div className="flex items-center gap-4 mt-2.5 text-[10px] text-stone-400 border-t border-stone-900/60 pt-2">
                            <span>{formatSqft(p.sqft)} Sqft</span>
                            <span>•</span>
                            <span>{p.beds} Bed / {p.baths} Bath</span>
                            <span>•</span>
                            <span className="text-[#84e114] font-bold">${p.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col justify-end gap-2 shrink-0 border-t sm:border-t-0 border-stone-850 pt-2.5 sm:pt-0">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="bg-stone-800 hover:bg-stone-750 text-stone-200 p-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                            title="Edit Details"
                          >
                            <Edit className="h-3.5 w-3.5" /> <span className="sm:hidden lg:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove '${p.name}' from catalog?`)) {
                                onDeletePlan(p.id);
                              }
                            }}
                            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 p-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> <span className="sm:hidden lg:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: ADD / EDIT BLUEPRINT */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              {editingPlan ? (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Editing existing blueprint: <strong className="text-white">{editingPlan.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetForm()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#84e114]" /> Switch to Add NEW Blueprint
                  </button>
                </div>
              ) : (
                <div className="bg-[#84e114]/10 border border-[#84e114]/30 text-[#84e114] px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Adding a NEW blueprint to catalog (will preserve all existing projects)</span>
                </div>
              )}

              <div className="bg-stone-950/30 border border-stone-850 rounded-xl p-5 space-y-4">
                <h3 className="font-mono text-[11px] font-bold text-[#84e114] tracking-widest uppercase border-b border-stone-850 pb-2">
                  1. Core Architecture Identity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Blueprint Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., The Cascade Villa"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Project No</label>
                    <input
                      type="text"
                      value={projectNo}
                      onChange={(e) => setProjectNo(e.target.value)}
                      placeholder="e.g., ORN-CASC-1024"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Design Subtitle</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g., Panoramic Lakeside Retreat"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Division / Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] outline-none font-sans cursor-pointer"
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Aesthetic Style *</label>
                    <input
                      type="text"
                      required
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="e.g., Scandinavian Modern, Contemporary"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Blueprint Base Price (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-stone-500 text-[10px] font-sans">$</span>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="1850"
                        className="w-full bg-stone-950 border border-stone-850 rounded-lg pl-8 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Brief Marketing Summary</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a description of the structural design, natural lighting capture, and material specifications."
                    className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans resize-none"
                  />
                </div>
              </div>

              <div className="bg-stone-950/30 border border-stone-850 rounded-xl p-5 space-y-4">
                <h3 className="font-mono text-[11px] font-bold text-[#84e114] tracking-widest uppercase border-b border-stone-850 pb-2">
                  2. Dimensional Specifications
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Net Plot (Sqft) *</label>
                    <input
                      type="text"
                      required
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      placeholder="e.g. 2800 or 50x100"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Bedrooms</label>
                    <input
                      type="number"
                      value={beds}
                      onChange={(e) => setBeds(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Bathrooms</label>
                    <input
                      type="number"
                      step="0.5"
                      value={baths}
                      onChange={(e) => setBaths(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Stories</label>
                    <input
                      type="number"
                      value={stories}
                      onChange={(e) => setStories(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Garage Bays</label>
                    <input
                      type="number"
                      value={garageBays}
                      onChange={(e) => setGarageBays(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Total Width</label>
                    <input
                      type="text"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 48 feet"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Total Depth</label>
                    <input
                      type="text"
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      placeholder="e.g. 56 feet"
                      className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-stone-950/30 border border-stone-850 rounded-xl p-5 space-y-4">
                <h3 className="font-mono text-[11px] font-bold text-[#84e114] tracking-widest uppercase border-b border-stone-850 pb-2">
                  3. Project Image Gallery (Multiple Images)
                </h3>

                <div className="space-y-4">
                  {/* Current image collection grid */}
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2">
                      Project Images (Click Set Cover to make first slide, or remove below)
                    </label>

                    {images.length === 0 ? (
                      <div className="text-stone-500 text-xs italic py-4 text-center border border-dashed border-stone-850 rounded-xl">
                        No images added yet. Upload files or select from presets below.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {images.map((img, idx) => {
                          const isCover = idx === 0;
                          return (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-850 bg-stone-950/85 h-24 shadow-inner">
                              <img src={img} alt={`Project image ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Move to front (make cover)
                                      setImages(prev => {
                                        const next = [...prev];
                                        const item = next.splice(idx, 1)[0];
                                        return [item, ...next];
                                      });
                                    }}
                                    className="bg-[#84e114]/20 hover:bg-[#84e114]/40 text-[#84e114] border border-[#84e114]/30 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold cursor-pointer"
                                  >
                                    Set Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImages(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 p-1 rounded cursor-pointer"
                                  title="Remove image"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              {isCover && (
                                <span className="absolute top-1.5 left-1.5 bg-[#84e114] text-stone-950 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded shadow">
                                  COVER
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Multi File Upload Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="block text-[10px] font-mono text-stone-500 uppercase mb-2">Upload Custom Images:</span>
                      <button
                        type="button"
                        disabled={isImageUploading}
                        onClick={() => document.getElementById('multi-file-uploader')?.click()}
                        className="w-full py-4 px-6 border-2 border-dashed border-stone-850 hover:border-stone-750 bg-stone-950/40 hover:bg-stone-950/60 disabled:opacity-50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-400 hover:text-white transition-all cursor-pointer"
                      >
                        {isImageUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#84e114] border-t-transparent" />
                            <span className="text-[11px] font-semibold text-[#84e114]">Uploading High-Res Image to Firebase Storage... {imageUploadProgress ?? 0}%</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-[#84e114]" />
                            <span className="text-[11px] font-semibold text-stone-300">Upload Full-Res Local Images</span>
                            <span className="text-[9px] text-stone-500">Maintains 100% original resolution on Firebase Storage</span>
                          </>
                        )}
                      </button>

                      {isImageUploading && imageUploadProgress !== null && (
                        <div className="w-full bg-stone-900 rounded-full h-1.5 mt-2 overflow-hidden border border-stone-800">
                          <div
                            className="bg-[#84e114] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${imageUploadProgress}%` }}
                          />
                        </div>
                      )}
                      <input
                        id="multi-file-uploader"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleMultipleFileChange}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-mono text-stone-500 uppercase mb-2">Add Preset to Gallery:</span>
                      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                        {PRESET_IMAGES.map((img, idx) => {
                          const alreadyIn = images.includes(img);
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={alreadyIn}
                              onClick={() => setImages(prev => [...prev, img])}
                              className={`h-14 w-20 rounded border transition-all shrink-0 cursor-pointer overflow-hidden relative ${
                                alreadyIn ? 'opacity-40 border-stone-900' : 'border-stone-800 hover:border-stone-600'
                              }`}
                              title={alreadyIn ? "Already in project gallery" : "Add to gallery"}
                            >
                              <img src={img} alt="preset preview" className="h-full w-full object-cover" />
                              {!alreadyIn && (
                                <div className="absolute inset-0 bg-black/45 hover:bg-transparent flex items-center justify-center text-white text-[10px] font-bold">
                                  + Add
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlights and Selling Points */}
                <div className="border-t border-stone-900/60 pt-4">
                  <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">Design Highlights / Selling Points</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add highlight (e.g. Cantilevered floor joists)"
                      className="flex-1 bg-stone-950 border border-stone-850 rounded-lg px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-stone-850 hover:bg-stone-800 text-stone-200 px-4 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="bg-stone-950 text-stone-300 px-2.5 py-1 text-[10px] rounded-md border border-stone-850 flex items-center gap-1.5"
                      >
                        {feat}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-stone-500 hover:text-stone-300 font-mono text-xs cursor-pointer focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Project Video Gallery */}
              <div className="bg-stone-950/30 border border-stone-850 rounded-xl p-5 space-y-4 text-left">
                <h3 className="font-mono text-[11px] font-bold text-[#84e114] tracking-widest uppercase border-b border-stone-850 pb-2">
                  4. Project Video Gallery (Optional Walkthroughs)
                </h3>

                <div className="space-y-4">
                  {/* Current videos collection */}
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2">
                      Active Walkthrough Videos
                    </label>

                    {videos.length === 0 ? (
                      <div className="text-stone-500 text-xs italic py-6 text-center border border-dashed border-stone-850 rounded-xl bg-stone-950/20">
                        No walkthrough videos added yet. Upload local files or paste external links below.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {videos.map((vid, idx) => {
                          const isData = isDataVideo(vid);
                          const isEmbed = isEmbedVideo(vid);
                          return (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-850 bg-stone-950/90 aspect-video flex flex-col justify-between shadow-inner">
                              <div className="w-full h-full bg-stone-900 flex items-center justify-center overflow-hidden">
                                {isData ? (
                                  <video src={vid} className="w-full h-full object-cover" muted controls={false} />
                                ) : isEmbed ? (
                                  <iframe src={getEmbedVideoUrl(vid)} className="w-full h-full pointer-events-none" frameBorder="0" />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-stone-500">
                                    <Video className="h-6 w-6 text-[#84e114]/60" />
                                    <span className="text-[10px] font-mono truncate max-w-[140px]">{vid}</span>
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1.5 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVideos(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove Video
                                </button>
                              </div>
                              <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur text-[8px] font-bold font-mono px-2 py-0.5 rounded border border-stone-800 text-[#84e114]">
                                {isData ? "LOCAL FILE" : isEmbed ? "EMBEDDED" : "DIRECT LINK"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Video Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Local File Uploader */}
                    <div>
                      <span className="block text-[10px] font-mono text-stone-500 uppercase mb-2">Upload Walkthrough Video:</span>
                      <button
                        type="button"
                        disabled={isVideoUploading}
                        onClick={() => document.getElementById('video-file-uploader')?.click()}
                        className="w-full py-4 px-6 border-2 border-dashed border-stone-850 hover:border-stone-750 bg-stone-950/40 hover:bg-stone-950/60 disabled:opacity-50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-400 hover:text-white transition-all cursor-pointer"
                      >
                        {isVideoUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#84e114] border-t-transparent" />
                            <span className="text-[11px] font-semibold text-[#84e114]">Uploading Video to Firebase Storage... {videoUploadProgress ?? 0}%</span>
                          </div>
                        ) : (
                          <>
                            <Video className="h-4 w-4 text-[#84e114]" />
                            <span className="text-[11px] font-semibold text-stone-300">Upload Local Video to Firebase Storage</span>
                            <span className="text-[9px] text-stone-500">Auto-synced in real-time across all devices (MP4, WebM)</span>
                          </>
                        )}
                      </button>

                      {isVideoUploading && videoUploadProgress !== null && (
                        <div className="w-full bg-stone-900 rounded-full h-1.5 mt-2 overflow-hidden border border-stone-800">
                          <div
                            className="bg-[#84e114] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${videoUploadProgress}%` }}
                          />
                        </div>
                      )}

                      <input
                        id="video-file-uploader"
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                          e.preventDefault();
                          if (e.target.files && e.target.files.length > 0) {
                            const filesArray = Array.from(e.target.files) as File[];
                            for (const file of filesArray) {
                              if (!file.type.startsWith('video/')) {
                                alert('Please upload a valid video file (MP4, WebM).');
                                continue;
                              }
                              
                              setIsVideoUploading(true);
                              setVideoUploadProgress(0);

                              try {
                                const downloadURL = await uploadMediaToStorage(file, 'videos', (progress) => {
                                  setVideoUploadProgress(progress);
                                });

                                setVideos((prev) => [...prev, downloadURL]);
                              } catch (err: any) {
                                console.error("Video upload failed:", err);
                                alert("Failed to upload video.");
                              } finally {
                                setIsVideoUploading(false);
                                setVideoUploadProgress(null);
                                e.target.value = '';
                              }
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </div>

                    {/* External Link Input */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <span className="block text-[10px] font-mono text-stone-500 uppercase mb-2">Or Add External Link:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="Paste YouTube, Vimeo, or MP4 video URL"
                            className="flex-1 bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newVideoUrl.trim()) {
                                setVideos(prev => [...prev, newVideoUrl.trim()]);
                                setNewVideoUrl('');
                              }
                            }}
                            className="bg-stone-850 hover:bg-stone-800 text-stone-200 px-3 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                          >
                            Add URL
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-normal mt-2">
                        💡 Direct YouTube links (e.g. <code>youtu.be/...</code>), Vimeo, or any remote mp4 address are parsed automatically into secure responsive players.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-stone-950/30 border border-stone-850 rounded-xl p-5 space-y-4">
                <h3 className="font-mono text-[11px] font-bold text-[#84e114] tracking-widest uppercase border-b border-stone-850 pb-2">
                  5. Editorial Features & Marketing Tags
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <label className="flex items-center gap-3 bg-stone-950/60 p-3.5 border border-stone-850 rounded-xl cursor-pointer select-none hover:border-[#84e114]/55 transition-colors">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="accent-[#84e114] h-4 w-4 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-white">Trending This Week</span>
                      <span className="block text-[10px] text-stone-400 mt-0.5">Feature this plan in the first row of the Trending Ribbon on the main page.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-stone-950/60 p-3.5 border border-stone-850 rounded-xl cursor-pointer select-none hover:border-[#84e114]/55 transition-colors">
                    <input
                      type="checkbox"
                      checked={isMostViewed}
                      onChange={(e) => setIsMostViewed(e.target.checked)}
                      className="accent-[#84e114] h-4 w-4 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-white">Most Viewed Plan</span>
                      <span className="block text-[10px] text-stone-400 mt-0.5">Feature this plan in the second row of the Most Viewed Ribbon on the main page.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab('list'); }}
                  className="px-5 py-2.5 border border-stone-800 text-stone-300 font-mono text-xs rounded-xl hover:bg-stone-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 bg-[#84e114] text-stone-950 hover:bg-[#72c310] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-stone-950 border-t-transparent" />
                      <span>Syncing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4.5 w-4.5" /> Confirm Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CUSTOMIZATION REQUESTS */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              <span className="text-xs font-mono text-stone-400 block text-left">
                Active modifications, floorplan adjustments, or digital checkouts submitted by clients:
              </span>

              {inquiries.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-800 rounded-2xl bg-stone-950/20">
                  <FolderOpen className="h-10 w-10 mx-auto text-stone-600 mb-2.5 opacity-40" />
                  <p className="text-stone-400 font-mono text-xs">No customer requests submitted yet.</p>
                  <p className="text-[10px] text-stone-600 font-sans mt-1">When users order or request design alterations in the client portal, they appear here.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {inquiries.map((req: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-stone-950/40 border border-stone-850 rounded-xl p-4 text-left space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">{req.clientName || 'Inquirer'}</h4>
                          <span className="text-[10px] font-mono text-[#84e114]">{req.email}</span>
                        </div>
                        <span className="text-[9px] font-mono text-stone-500 uppercase bg-stone-950 px-2 py-0.5 rounded border border-stone-850">
                          {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : 'New Request'}
                        </span>
                      </div>

                      <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-850/60 text-xs text-stone-300 font-light leading-relaxed">
                        <span className="block text-[9px] font-mono text-stone-500 uppercase tracking-wider mb-1">Inquired Blueprint:</span>
                        <div className="flex items-center gap-2 mb-2 font-sans font-semibold text-white">
                          <Home className="h-3.5 w-3.5 text-[#84e114]" />
                          <span>{req.planName}</span>
                        </div>
                        <span className="block text-[9px] font-mono text-stone-500 uppercase tracking-wider mb-1">Requested Alterations:</span>
                        <p className="font-sans italic">"{req.details || req.message || 'No specific details provided. Requesting baseline structural sheets.'}"</p>
                      </div>

                      {req.selectedModifications && req.selectedModifications.length > 0 && (
                        <div>
                          <span className="block text-[9px] font-mono text-stone-500 uppercase tracking-wider mb-1.5">Requested Add-ons:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {req.selectedModifications.map((mod: string, mIdx: number) => (
                              <span
                                key={mIdx}
                                className="bg-stone-900 border border-stone-800 text-[10px] font-mono px-2 py-0.5 rounded text-stone-300 flex items-center gap-1"
                              >
                                <Tag className="h-2.5 w-2.5 text-[#84e114]" /> {mod}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2 border-t border-stone-900">
                        <a
                          href={`mailto:${req.email}?subject=Regarding your Oren plans inquiry for ${encodeURIComponent(req.planName)}`}
                          className="bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-200 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          Reply to Client
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUPABASE CLOUD DATABASE & STORAGE */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 text-left">
              {/* Header card */}
              <div className="bg-stone-950/80 border border-stone-850 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-[#84e114]" />
                      <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                        Supabase Cloud Database & Storage
                      </h3>
                    </div>
                    <p className="text-xs text-stone-400 font-light">
                      Real-time persistent cloud storage for all your architectural floorplans, renders, and designs.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href="https://supabase.com/dashboard/project/rbqjcalcoaavuxqsyave"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white rounded-xl text-xs font-mono transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#84e114]" /> Open Supabase Console
                    </a>
                    <button
                      onClick={handleTestSupabase}
                      disabled={supabaseTestStatus.loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#84e114] hover:bg-[#95f025] text-stone-950 font-bold rounded-xl text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${supabaseTestStatus.loading ? 'animate-spin' : ''}`} />
                      {supabaseTestStatus.loading ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {/* Card 1: Config */}
                  <div className="bg-stone-900/60 border border-stone-850 p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">API Credentials</span>
                    <div className="flex items-center gap-2">
                      {supabaseTestStatus.configured ? (
                        <CheckCircle2 className="h-4 w-4 text-[#84e114] shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-mono text-xs text-white font-semibold truncate">
                        {supabaseTestStatus.configured ? 'Configured (.env)' : 'Missing Keys'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 truncate block">
                      rbqjcalcoaavuxqsyave.supabase.co
                    </span>
                  </div>

                  {/* Card 2: Database Table */}
                  <div className="bg-stone-900/60 border border-stone-850 p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Table: public.projects</span>
                    <div className="flex items-center gap-2">
                      {supabaseTestStatus.tested ? (
                        supabaseTestStatus.tableOk ? (
                          <CheckCircle2 className="h-4 w-4 text-[#84e114] shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        )
                      ) : (
                        <Database className="h-4 w-4 text-stone-500 shrink-0" />
                      )}
                      <span className="font-mono text-xs text-white font-semibold">
                        {supabaseTestStatus.tested
                          ? supabaseTestStatus.tableOk
                            ? `Active (${supabaseTestStatus.tableCount} rows)`
                            : 'Table Not Found / RLS Error'
                          : 'Click Test Connection'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 block">
                      {supabaseTestStatus.tableOk ? 'Row Level Security (RLS) Ready' : 'Requires SQL Setup'}
                    </span>
                  </div>

                  {/* Card 3: Storage Bucket */}
                  <div className="bg-stone-900/60 border border-stone-850 p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Bucket: storage/projects</span>
                    <div className="flex items-center gap-2">
                      {supabaseTestStatus.tested ? (
                        supabaseTestStatus.storageOk ? (
                          <CheckCircle2 className="h-4 w-4 text-[#84e114] shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        )
                      ) : (
                        <HardDrive className="h-4 w-4 text-stone-500 shrink-0" />
                      )}
                      <span className="font-mono text-xs text-white font-semibold">
                        {supabaseTestStatus.tested
                          ? supabaseTestStatus.storageOk
                            ? `Ready (${supabaseTestStatus.storageFilesCount} files)`
                            : 'Bucket Not Created / Private'
                          : 'Click Test Connection'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 block">
                      Public image uploads & CDN
                    </span>
                  </div>
                </div>

                {/* Status or Guidance Banner */}
                {supabaseTestStatus.tested && (
                  <>
                    {supabaseTestStatus.tableOk && !supabaseTestStatus.storageOk && (
                      <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-amber-400 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-[#84e114]" /> Database Table Connected! Storage Bucket Needed
                          </span>
                          <a
                            href="https://supabase.com/dashboard/project/rbqjcalcoaavuxqsyave/storage/buckets"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-sans font-semibold transition-colors"
                          >
                            Open Supabase Storage <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-[11px] text-amber-300/80 leading-relaxed font-sans">
                          Your <code className="bg-stone-900 px-1 py-0.5 rounded text-white font-mono">public.projects</code> database table is fully operational. To enable direct image and blueprint uploads, create the <strong className="text-white">projects</strong> storage bucket:
                        </p>
                        <div className="bg-stone-900/90 p-3 rounded-lg border border-stone-800 text-[11px] text-stone-300 font-sans space-y-1.5">
                          <p><strong className="text-[#84e114]">Method 1 (Easiest — 3 clicks):</strong> Go to Supabase <strong>Storage</strong> → Click <strong>New bucket</strong> → Name it <code className="text-white font-mono font-bold bg-stone-800 px-1 py-0.5 rounded">projects</code> → Switch <strong>Public bucket</strong> to <strong className="text-[#84e114]">ON</strong> → Click <strong>Save</strong>.</p>
                          <p><strong className="text-[#84e114]">Method 2 (SQL):</strong> Or copy and run the SQL script below in your Supabase SQL editor.</p>
                        </div>
                      </div>
                    )}

                    {!supabaseTestStatus.tableOk && supabaseTestStatus.errorMessage && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-red-400">
                          <AlertTriangle className="h-4 w-4" /> Supabase Connection Error:
                        </span>
                        <p className="text-[11px] leading-relaxed">{supabaseTestStatus.errorMessage}</p>
                      </div>
                    )}

                    {supabaseTestStatus.tableOk && supabaseTestStatus.storageOk && (
                      <div className="mt-4 p-3 bg-[#84e114]/10 border border-[#84e114]/30 rounded-xl text-[#84e114] text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>All Systems Operational! Database table and Storage bucket are live and ready.</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sync Actions Card */}
              <div className="bg-stone-950/60 border border-stone-850 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                      Sync All Catalog Designs to Supabase
                    </h4>
                    <p className="text-xs text-stone-400 font-light mt-0.5">
                      Upload your {plans.length} current architectural plans and blueprints to your Supabase cloud table.
                    </p>
                  </div>

                  <button
                    onClick={handleSyncAllToSupabase}
                    disabled={isSyncingSupabase}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84e114] hover:bg-[#95f025] text-stone-950 font-display font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Cloud className={`h-4 w-4 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
                    {isSyncingSupabase ? 'Uploading to Supabase...' : `Push All ${plans.length} Plans to Supabase`}
                  </button>
                </div>

                {supabaseSyncProgress && (
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl font-mono text-xs text-[#84e114] animate-pulse">
                    {supabaseSyncProgress}
                  </div>
                )}

                {/* Test Image Upload */}
                <div className="pt-4 border-t border-stone-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-stone-300 font-semibold block">Test Storage Bucket Upload:</span>
                    <span className="text-[11px] text-stone-500">Pick any image from your computer to verify it uploads to your `projects` bucket in Supabase.</span>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 rounded-xl text-xs font-mono cursor-pointer transition-colors shrink-0">
                    <Upload className="h-3.5 w-3.5 text-[#84e114]" />
                    {isTestUploading ? 'Uploading...' : 'Upload Test Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadTestImage}
                      disabled={isTestUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {testUploadUrl && (
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs space-y-1.5">
                    <span className="text-[#84e114] font-mono text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" /> Uploaded to Supabase Storage Successfully:
                    </span>
                    <a
                      href={testUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-300 hover:underline font-mono text-[10px] break-all block"
                    >
                      {testUploadUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* SQL Setup Helper */}
              <div className="bg-stone-950/60 border border-stone-850 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Supabase SQL Table Schema & Permissions</span>
                    </h4>
                    <p className="text-xs text-stone-400 font-light mt-0.5">
                      If you see a "Table Not Found" or "RLS Error", copy this script and run it in your Supabase SQL Editor.
                    </p>
                  </div>

                  <button
                    onClick={copySqlScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                  >
                    {copiedSql ? <Check className="h-3.5 w-3.5 text-[#84e114]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                  </button>
                </div>

                <pre className="bg-stone-900/80 p-4 rounded-xl text-[11px] font-mono text-stone-300 border border-stone-850 overflow-x-auto max-h-56 leading-relaxed">
{`-- 1. Create table in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  sqft NUMERIC DEFAULT 0,
  beds NUMERIC DEFAULT 0,
  baths NUMERIC DEFAULT 0,
  stories NUMERIC DEFAULT 1,
  garage_bays NUMERIC DEFAULT 0,
  width TEXT,
  depth TEXT,
  style TEXT,
  category TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  floors JSONB DEFAULT '[]'::jsonb,
  is_trending BOOLEAN DEFAULT false,
  is_most_viewed BOOLEAN DEFAULT false,
  project_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and public access
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public write access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- 2. Create Storage Bucket & Policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Storage Access" ON storage.objects FOR SELECT USING (bucket_id = 'projects');
CREATE POLICY "Public Storage Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'projects');
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (bucket_id = 'projects');
CREATE POLICY "Public Storage Delete" ON storage.objects FOR DELETE USING (bucket_id = 'projects');`}
                </pre>
              </div>
            </div>
          )}

        </div>
      </>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-900/40 relative overflow-hidden" id="admin-login-screen">
        {/* Ambient Background Glow (Green theme color to keep it beautiful and in line with requirements, NO red) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#84e114]/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-stone-950/80 border border-stone-850 rounded-2xl p-8 relative z-10 shadow-2xl backdrop-blur-sm space-y-6" id="admin-login-card">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-[#84e114]/15 rounded-full text-[#84e114] mb-2 animate-bounce" id="admin-login-lock-container">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white tracking-wide uppercase" id="admin-login-title">Credentials Required</h3>
            <p className="text-xs text-stone-400 font-light max-w-xs mx-auto" id="admin-login-subtitle">
              Access is restricted to authorized designers of Oren Design & Build.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" id="admin-login-form">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
                Email
              </label>
              <input
                type="email"
                required
                id="admin-login-email-input"
                placeholder="yours@gmail.com"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (loginError) setLoginError('');
                }}
                className="w-full bg-stone-900 border border-stone-800 focus:border-[#84e114]/60 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-600 focus:outline-none transition-all duration-300 shadow-inner"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
                Password
              </label>
              <input
                type="password"
                required
                id="admin-login-password-input"
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  if (loginError) setLoginError('');
                }}
                className="w-full bg-stone-900 border border-stone-800 focus:border-[#84e114]/60 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-600 focus:outline-none transition-all duration-300 shadow-inner"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] p-3 rounded-lg leading-relaxed animate-fade-in text-left" id="admin-login-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              id="admin-login-submit-btn"
              className="w-full bg-stone-100 hover:bg-white text-stone-950 font-display font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 shadow-md cursor-pointer hover:shadow-[#84e114]/10 active:scale-[0.98]"
            >
              Authenticate Session
            </button>
          </form>

          <div className="text-center">
            <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">
              OREN DASHBOARD
            </span>
          </div>
        </div>
      </div>
    )}

      </div>
    </div>
  );
}
