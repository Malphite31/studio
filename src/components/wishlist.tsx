'use client';

import type { WishlistItem as WishlistItemType, Expense } from '@/lib/types';
import WishlistForm from './wishlist-form';
import WishlistItem from './wishlist-item';

interface WishlistProps {
  items: WishlistItemType[];
  addWishlistItem: (item: Omit<WishlistItemType, 'id' | 'savedAmount' | 'userId'>) => void;
  contributeToWishlist: (id: string, amount: number, currentSaved: number, targetAmount: number) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date' | 'userId'>) => void;
}

export default function Wishlist({ items, addWishlistItem, contributeToWishlist, addExpense }: WishlistProps) {
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
              addExpense={addExpense}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm py-4">Your wish list is empty.</p>
      )}
    </div>
  );
}
