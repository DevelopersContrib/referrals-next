"use client";

type ContactRow = {
	id: number;
	name: string;
	email: string;
	date_signedup: string;
	campaign_name: string;
};

type ContactsMobileListProps = {
	contacts: ContactRow[];
};

export function ContactsMobileList({ contacts }: ContactsMobileListProps) {
	return (
		<div className="space-y-3 lg:hidden">
			{contacts.map((contact) => (
				<div
					key={contact.id}
					className="rounded-lg border border-portlet-border bg-[#f9fafb] p-4"
				>
					<p className="truncate font-medium text-[#575962]">
						{contact.name}
					</p>
					<p className="mt-0.5 truncate text-sm text-muted-foreground">
						{contact.email}
					</p>
					<div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
						<span className="min-w-0 flex-1 truncate">
							{contact.campaign_name}
						</span>
						<span className="shrink-0">
							{new Date(contact.date_signedup).toLocaleDateString()}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
