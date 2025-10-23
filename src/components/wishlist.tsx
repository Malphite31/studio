'use client';

import type { WishlistItem as WishlistItemType, EWallet } from '@/lib/types';
import WishlistForm from './wishlist-form';
import WishlistItem from './wishlist-item';

interface WishlistProps {
  items: WishlistItemType[];
  addWishlistItem: (item: Omit<WishlistItemType, 'id' | 'savedAmount' | 'userId' | 'purchased'>) => void;
  contributeToWishlist: (item: WishlistItemType, amount: number, walletId: string) => Promise<{ goalReached: boolean }>;
  purchaseWishlistItem: (item: WishlistItemType) => void;
  wallets: EWallet[];
}

export default function Wishlist({ items, addWishlistItem, contributeToWishlist, purchaseWishlistItem, wallets }: WishlistProps) {
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
              wallets={wallets}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm py-4">Your wish list is empty.</p>
      )}
    </div>
  );
}
