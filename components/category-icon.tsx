import {
  BookOpen,
  Briefcase,
  Car,
  Dumbbell,
  Gift,
  HeartPulse,
  Home,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  PlusCircle,
  Receipt,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Tv,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wrench,
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
  scissors: Scissors,
  dumbbell: Dumbbell,
  pill: Pill,
  paw: PawPrint,
  shirt: Shirt,
  gift: Gift,
  book: BookOpen,
  wrench: Wrench,
  plane: Plane,
  receipt: Receipt,
  piggy: PiggyBank,
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
