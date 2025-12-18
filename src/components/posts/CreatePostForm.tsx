'use client';

/**
 * Create Post Form Component
 * Handles creating new posts with media upload
 */

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ImagePlus, 
  Video, 
  X, 
  Loader2, 
  MapPin, 
  Tag, 
  DollarSign,
  Send
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createPost } from '@/services/postsService';
import { CreatePostData, CATEGORIES } from '@/types';

export default function CreatePostForm() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    description: '',
    price: undefined,
    currency: 'RON',
    location: '',
    category: undefined,
  });
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 files
    const newFiles = files.slice(0, 10 - mediaFiles.length);
    
    // Check for large video files (warn if > 50MB)
    const largeVideos = newFiles.filter(f => 
      f.type.startsWith('video/') && f.size > 50 * 1024 * 1024
    );
    if (largeVideos.length > 0) {
      const sizeMB = Math.round(largeVideos[0].size / (1024 * 1024));
      setError(`Video-ul (${sizeMB}MB) este mare și va dura mai mult să se încarce. Recomandăm video-uri sub 50MB.`);
      // Still allow upload, just warn
      setTimeout(() => setError(null), 5000);
    }
    
    setMediaFiles(prev => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Trebuie să fii autentificat pentru a crea o postare.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Titlul este obligatoriu.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await createPost(
        formData,
        user.id,
        user.email,
        user.fullName || user.email,
        user.profileImage || '',
        mediaFiles,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        setUploadProgress(100);
        router.push('/');
      } else {
        setError(result.error || 'Eroare la crearea postării.');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Eroare la crearea postării. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">
              {uploadProgress < 90 ? 'Se încarcă fișierele...' : 
               uploadProgress < 100 ? 'Se creează postarea...' : 'Finalizat!'}
            </span>
            <span className="text-sm text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Titlu *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Ce vinzi sau oferi?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Descriere
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Adaugă o descriere detaliată..."
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagini / Video
        </label>
        
        {/* Previews */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
            {mediaPreviews.map((preview, index) => {
              const file = mediaFiles[index];
              const isVideo = file?.type.startsWith('video/');
              const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : '0';
              
              return (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {isVideo ? (
                    <video
                      src={preview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}
                  {/* File size badge */}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                    {isVideo ? '🎥' : '📷'} {sizeMB}MB
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload buttons */}
        <div className="flex space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaFiles.length >= 10}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImagePlus className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Adaugă imagini</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaFiles.length >= 10}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Adaugă video</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Maximum 10 fișiere. Tipuri acceptate: JPG, PNG, GIF, MP4, MOV
        </p>
      </div>

      {/* Price and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Preț
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price || ''}
            onChange={handleInputChange}
            placeholder="0"
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
            Monedă
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4 inline mr-1" />
          Categorie
        </label>
        <select
          id="category"
          name="category"
          value={formData.category || ''}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="">Selectează o categorie</option>
          {CATEGORIES.map(cat => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Locație
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="București, Sector 1"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.title.trim()}
        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Se publică...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Publică postarea</span>
          </>
        )}
      </button>
    </form>
  );
}
