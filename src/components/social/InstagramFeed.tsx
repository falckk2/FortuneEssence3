'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface InstagramPost {
  id: string;
  image: string;
  alt: string;
  likes: number;
}

interface InstagramFeedProps {
  locale?: 'sv' | 'en';
}

export const InstagramFeed = ({ locale = 'sv' }: InstagramFeedProps) => {
  // Mock Instagram posts - in production, fetch from Instagram API
  const mockPosts: InstagramPost[] = [
    {
      id: '1',
      image: '/images/instagram/post1.jpg',
      alt: 'Customer using lavender oil',
      likes: 245,
    },
    {
      id: '2',
      image: '/images/instagram/post2.jpg',
      alt: 'Beautiful diffuser setup',
      likes: 312,
    },
    {
      id: '3',
      image: '/images/instagram/post3.jpg',
      alt: 'Morning wellness routine',
      likes: 189,
    },
    {
      id: '4',
      image: '/images/instagram/post4.jpg',
      alt: 'Essential oil collection',
      likes: 278,
    },
    {
      id: '5',
      image: '/images/instagram/post5.jpg',
      alt: 'Relaxing bath time',
      likes: 356,
    },
    {
      id: '6',
      image: '/images/instagram/post6.jpg',
      alt: 'Aromatherapy workspace',
      likes: 201,
    },
  ];

  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-forest-700 mb-4">
            {locale === 'sv' ? 'Gå med i gemenskapen' : 'Join the Community'}
          </h2>
          <p className="text-lg text-forest-600 mb-6">
            {locale === 'sv'
              ? 'Dela ditt välmåenderitual med #FortuneEssence'
              : 'Share your wellness ritual with #FortuneEssence'}
          </p>
          <Link
            href="https://instagram.com/fortuneessence"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-full transition-all shadow-soft hover:shadow-lg hover:-translate-y-0.5 transform"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>@fortuneessence</span>
          </Link>
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockPosts.map((post) => (
            <Link
              key={post.id}
              href="https://instagram.com/fortuneessence"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-cream-200 hover:scale-105 transition-transform duration-300"
            >
              {!imageErrors[post.id] ? (
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(post.id)}
                />
              ) : (
                // Fallback gradient for missing images
                <div className="w-full h-full bg-gradient-to-br from-sage-200 to-terracotta-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="flex items-center gap-2 text-white text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>{post.likes}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 p-8 bg-white rounded-3xl shadow-soft max-w-2xl mx-auto">
          <p className="text-lg text-forest-700 mb-4">
            {locale === 'sv'
              ? '🌿 Tagga oss i dina bilder för en chans att synas här!'
              : '🌿 Tag us in your photos for a chance to be featured!'}
          </p>
          <p className="text-sm text-forest-600">
            {locale === 'sv'
              ? 'Använd #FortuneEssence och @fortuneessence'
              : 'Use #FortuneEssence and @fortuneessence'}
          </p>
        </div>
      </div>
    </section>
  );
};
