'use client';

/**
 * Create Post Page
 */

import React from 'react';
import { PenSquare } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreatePostForm from '@/components/posts/CreatePostForm';

function CreatePostContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <PenSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Postare nouă</h1>
        </div>
        <p className="text-gray-600">
          Creează un anunț nou și ajunge la mii de utilizatori.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <CreatePostForm />
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <ProtectedRoute>
      <CreatePostContent />
    </ProtectedRoute>
  );
}
