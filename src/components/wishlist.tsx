'use client';

import type { WishlistItem as WishlistItemType } from '@/lib/types';
import WishlistForm from './wishlist-form';
import WishlistItem from './wishlist-item';

interface WishlistProps {
  items: WishlistItemType[];
  addWishlistItem: (item: Omit<WishlistItemType, 'id' | 'savedAmount'>) => void;
  contributeToWishlist: (id: string, amount: number, currentSaved: number, targetAmount: number) => void;
}

export default function Wishlist({ items, addWishlistItem, contributeToWishlist }: WishlistProps) {
  return (
    <div className="grid gap-4 md:gap-8 mt-4">
      <WishlistForm addWishlistItem={addWishlistItem} />
      <div className="space-y-4">
        {items.map((item) => (
          <WishlistItem key={item.id} item={item} contributeToWishlist={contributeToWishlist} />
        ))}
      </div>
    </div>
  );
}
