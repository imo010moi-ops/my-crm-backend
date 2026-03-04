import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/hooks/useTelegram';
import { mastersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  MapPin, 
  Star, 
  ChevronLeft,
  User,
  Scissors
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Master {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  businessName: string;
  description: string;
}

export function ClientMasters() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [filteredMasters, setFilteredMasters] = useState<Master[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showBackButton, hideBackButton, impactOccurred } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    showBackButton(() => navigate('/'));
    return () => hideBackButton();
  }, [navigate, showBackButton, hideBackButton]);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = masters.filter(master => 
        master.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        master.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        master.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMasters(filtered);
    } else {
      setFilteredMasters(masters);
    }
  }, [searchQuery, masters]);

  const loadMasters = async () => {
    try {
      setIsLoading(true);
      const response = await mastersApi.getAll();
      setMasters(response.data.masters || []);
      setFilteredMasters(response.data.masters || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMaster = (masterId: number) => {
    impactOccurred('medium');
    navigate(`/client/book/${masterId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Выбор мастера</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск мастеров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Masters List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredMasters.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Мастера не найдены' : 'Пока нет доступных мастеров'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMasters.map((master) => (
              <Card 
                key={master.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectMaster(master.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {master.firstName?.[0]}{master.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {master.businessName || `${master.firstName} ${master.lastName}`}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {master.description || 'Мастер с опытом работы'}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          <Scissors className="w-3 h-3 mr-1" />
                          Услуги
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-yellow-500" />
                          4.9
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
