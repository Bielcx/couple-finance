import {
  Briefcase,
  Car,
  HeartPulse,
  Home,
  PartyPopper,
  PlusCircle,
  ShoppingBag,
  ShoppingCart,
  Tv,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  wifi: Wifi,
  tv: Tv,
  zap: Zap,
  car: Car,
  cart: ShoppingCart,
  utensils: UtensilsCrossed,
  party: PartyPopper,
  "heart-pulse": HeartPulse,
  bag: ShoppingBag,
  briefcase: Briefcase,
  "plus-circle": PlusCircle,
  wallet: Wallet,
};

export function CategoryIcon({
  icon,
  className = "h-4 w-4",
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = (icon && ICON_MAP[icon]) || Wallet;
  return <Icon className={className} />;
}
