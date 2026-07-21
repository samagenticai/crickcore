import {
  Bell,
  Trophy,
  Globe,
  Award,
  Users,
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

const ICON_MAP = {
  bell: Bell,
  trophy: Trophy,
  globe: Globe,
  award: Award,
  users: Users,
  calendar: Calendar,
  play: Play,
  "check-circle": CheckCircle,
  alert: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export const NOTIFICATION_TYPE_STYLES = {
  success: "bg-emerald-50 text-emerald-600 border-emerald-100",
  info: "bg-sky-50 text-sky-600 border-sky-100",
  warning: "bg-amber-50 text-amber-600 border-amber-100",
  error: "bg-red-50 text-red-600 border-red-100",
};

export function getNotificationIcon(iconName) {
  return ICON_MAP[iconName] || Bell;
}

export function getNotificationLink(notification) {
  switch (notification?.relatedType) {
    case "tournament":
      return "/dashboard/tournaments";
    case "match":
      return "/dashboard/matches";
    case "fixture":
      return "/dashboard/fixtures";
    case "team":
      return "/dashboard/teams";
    default:
      return "/dashboard/notifications";
  }
}
