import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrandCardProps {
  domain: string;
  url: string;
  logoUrl?: string | null;
  description?: string | null;
}

export function BrandCard({ domain, url, logoUrl, description }: BrandCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${domain} logo`}
            className="h-12 w-12 rounded-md object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg font-bold uppercase text-muted-foreground">
            {domain.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <CardTitle className="text-lg">{domain}</CardTitle>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            {url}
          </a>
        </div>
        <Badge variant="secondary">Brand</Badge>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}
