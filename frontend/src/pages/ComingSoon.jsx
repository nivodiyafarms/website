import React from 'react';
import { COMING_SOON } from '../strings/hi';

export default function ComingSoon() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
      <p className="text-6xl mb-5">🚧</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{COMING_SOON.heading}</h1>
      <p className="text-gray-400">{COMING_SOON.body}</p>
    </div>
  );
}
