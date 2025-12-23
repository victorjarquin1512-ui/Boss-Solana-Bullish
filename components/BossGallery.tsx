'use client';

import React from 'react';
import Image from 'next/image';

const galleryImages = [
  { src: '/boss-cyber.jpg', alt: 'Cybernetic Boss Bull' },
  { src: '/boss-throne.jpg', alt: 'Boss on the Throne' },
  { src: '/boss-vs-bear.jpg', alt: 'Boss vs The Bear' },
  { src: '/boss-spartan.jpg', alt: 'Spartan Boss' },
  { src: '/boss-lambo.jpg', alt: 'Boss in a Lambo' },
  { src: '/boss-poolside.jpg', alt: 'Boss Poolside' },
  { src: '/boss-jet.jpg', alt: 'Boss Solana Jet' },
];

export default function BossGallery() {
  return (
    <section id="gallery" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase mb-4">
            The <span className="text-[#9945FF]">Bull</span> Gallery
          </h2>
          <p className="text-zinc-500 font-mono tracking-widest uppercase italic">Visualizing the Vision</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, index) => (
            <div 
              key={index} 
              className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-800 group"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <p className="text-white font-bold italic uppercase">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}