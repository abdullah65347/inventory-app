import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProductService } from '../../services/user-product.service';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AdminProductResponse } from '../../../common/models/product.model';
import { SaleRequest } from '../../../common/models/sale.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

export interface CartItem { product: AdminProductResponse; quantity: number; }

@Component({
  selector: 'app-user-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './user-products.component.html',
  styleUrls: ['./user-products.component.css'],
  animations: [fadeIn]
})
export class UserProductsComponent implements OnInit {
  auth       = inject(AuthService);
  productSvc = inject(UserProductService);
  saleSvc    = inject(SaleService);
  toast      = inject(ToastService);

  products = signal<AdminProductResponse[]>([]);
  filtered = signal<AdminProductResponse[]>([]);
  cart     = signal<CartItem[]>([]);
  loading  = signal(true);
  showCart = signal(false);
  placing  = signal(false);
  search   = '';

  ngOnInit(): void {
    this.productSvc.getAll().subscribe({
      next: p => {
        const withPrice = p.filter(x => x.adminToUserPrice > 0);
        this.products.set(withPrice);
        this.filtered.set(withPrice);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter(): void {
    const s = this.search.toLowerCase();
    this.filtered.set(this.products().filter(p =>
      p.name.toLowerCase().includes(s) || (p.description ?? '').toLowerCase().includes(s)
    ));
  }

  addToCart(p: AdminProductResponse): void {
    const ex = this.cart().find(i => i.product.id === p.id);
    if (ex) {
      this.cart.update(items => items.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      this.cart.update(items => [...items, { product: p, quantity: 1 }]);
    }
    this.toast.success(`${p.name} added to cart`);
  }

  changeQty(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty < 1) { this.removeItem(item.product.id); return; }
    this.cart.update(items => items.map(i => i.product.id === item.product.id ? { ...i, quantity: newQty } : i));
  }

  removeItem(id: number): void {
    this.cart.update(items => items.filter(i => i.product.id !== id));
  }

  get cartTotal(): number {
    return this.cart().reduce((sum, i) => sum + i.product.adminToUserPrice * i.quantity, 0);
  }

  get cartCount(): number {
    return this.cart().reduce((sum, i) => sum + i.quantity, 0);
  }

  placeOrder(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.placing.set(true);
    const req: SaleRequest = {
      userId: user.id,
      items: this.cart().map(i => ({ productId: i.product.id, quantity: i.quantity }))
    };
    this.saleSvc.create(req).subscribe({
      next: () => {
        this.toast.success('Order placed successfully!');
        this.cart.set([]);
        this.showCart.set(false);
        this.placing.set(false);
      },
      error: err => {
        this.toast.error(err?.error?.message ?? 'Failed to place order');
        this.placing.set(false);
      }
    });
  }
}
