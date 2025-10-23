'use client';

import type { WishlistItem as WishlistItemType } from '@/lib/types';
import WishlistForm from './wishlist-form';
import WishlistItem from './wishlist-item';

interface WishlistProps {
  items: WishlistItemType[];
  addWishlistItem: (item: Omit<WishlistItemType, 'id' | 'savedAmount' | 'userId'>) => void;
  contributeToWishlist: (item: WishlistItemType, amount: number) => void;
  purchaseWishlistItem: (item: WishlistItemType) => void;
}

export default function Wishlist({ items, addWishlistItem, contributeToWishlist, purchaseWishlistItem }: WishlistProps) {
  return (
    <div className="grid gap-4 md:gap-8">
      <WishlistForm addWishlistItem={addWishlistItem} />
       {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <WishlistItem 
              key={item.id} 
              item={item} 
              contributeToWishlist={contributeToWishlist} 
              purchaseWishlistItem={purchaseWishlistItem}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm py-4">Your wish list is empty.</p>
      )}
    </div>
  );
}
