import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  protocolFilter: string;
  onProtocolChange: (value: string) => void;
}

export const FilterBar = ({ searchTerm, onSearchChange, protocolFilter, onProtocolChange }: FilterBarProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search packets by IP, protocol, or info..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-secondary/50 border-primary/20 focus:border-primary"
        />
      </div>
      <Select value={protocolFilter} onValueChange={onProtocolChange}>
        <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-primary/20">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="All Protocols" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Protocols</SelectItem>
          <SelectItem value="TCP">TCP</SelectItem>
          <SelectItem value="UDP">UDP</SelectItem>
          <SelectItem value="HTTP">HTTP</SelectItem>
          <SelectItem value="HTTPS">HTTPS</SelectItem>
          <SelectItem value="DNS">DNS</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
        Export PCAP
      </Button>
    </div>
  );
};
