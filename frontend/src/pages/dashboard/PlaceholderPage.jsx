import { Construction } from "lucide-react";
import EmptyState from "../../components/dashboard/EmptyState";

export default function PlaceholderPage({ title }) {
  return (
    <EmptyState
      icon={Construction}
      title={`${title} — Coming Soon`}
      description="This module is part of the platform roadmap. Tournament management is fully available now."
    />
  );
}
