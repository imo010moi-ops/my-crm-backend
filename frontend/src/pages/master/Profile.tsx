import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTelegram } from '@/hooks/useTelegram';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Clock, 
  ChevronLeft,
  Save,
  Store
} from 'lucide-react';
import { notificationOccurred } from '@/hooks/useTelegram';

interface DaySchedule {
  start: string;
  end: string;
  isWorking: boolean;
}

const defaultWorkingHours: Record<string, DaySchedule> = {
  monday: { start: '09:00', end: '18:00', isWorking: true },
  tuesday: { start: '09:00', end: '18:00', isWorking: true },
  wednesday: { start: '09:00', end: '18:00', isWorking: true },
  thursday: { start: '09:00', end: '18:00', isWorking: true },
  friday: { start: '09:00', end: '18:00', isWorking: true },
  saturday: { start: '09:00', end: '18:00', isWorking: true },
  sunday: { start: '09:00', end: '18:00', isWorking: false },
};

const dayNames: Record<string, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье'
};

export function MasterProfile() {
  const { user, updateUser } = useAuth();
  const { showBackButton, hideBackButton, showMainButton, hideMainButton } = useTelegram();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    businessName: '',
    description: '',
    address: '',
    phone: '',
    workingHours: defaultWorkingHours
  });

  useEffect(() => {
    showBackButton(() => navigate('/'));
    return () => hideBackButton();
  }, [navigate, showBackButton, hideBackButton]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    showMainButton('Сохранить', handleSave);
    return () => hideMainButton();
  }, [profile]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getMe();
      const { profile: userProfile, user: userData } = response.data;
      
      if (userProfile) {
        setProfile({
          businessName: userProfile.business_name || '',
          description: userProfile.description || '',
          address: userProfile.address || '',
          phone: userProfile.phone || userData.phone || '',
          workingHours: userProfile.working_hours || defaultWorkingHours
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await authApi.updateProfile({
        businessName: profile.businessName,
        description: profile.description,
        address: profile.address,
        phone: profile.phone,
        workingHours: profile.workingHours
      });
      
      if (profile.phone) {
        updateUser({ phone: profile.phone });
      }
      
      notificationOccurred('success');
    } catch (error) {
      notificationOccurred('error');
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateWorkingHours = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Профиль мастера</h1>
          </div>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* User Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">@{user?.username}</p>
                <Badge variant="secondary" className="mt-1">Мастер</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5" />
              Информация о бизнесе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Название бизнеса</Label>
              <Input
                id="businessName"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                placeholder="Например: Студия красоты"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Расскажите о себе и своих услугах"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Адрес
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Город, улица, дом"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Телефон
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+7 (999) 999-99-99"
              />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Рабочий график
            </CardTitle>
            <CardDescription>
              Настройте часы работы для каждого дня
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(dayNames).map(([day, dayName]) => (
              <div key={day} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Switch
                  checked={profile.workingHours[day]?.isWorking}
                  onCheckedChange={(checked) => updateWorkingHours(day, 'isWorking', checked)}
                />
                <span className="flex-1 font-medium">{dayName}</span>
                {profile.workingHours[day]?.isWorking ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={profile.workingHours[day]?.start}
                      onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                      className="w-20"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={profile.workingHours[day]?.end}
                      onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                      className="w-20"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Выходной</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
