import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Scissors, User, TrendingUp, Clock, Sparkles } from 'lucide-react';

export function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showMainButton, hideMainButton, impactOccurred } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      showMainButton('Открыть приложение', () => {
        impactOccurred('medium');
        navigate(user.role === 'master' ? '/master' : '/client');
      });
    }

    return () => {
      hideMainButton();
    };
  }, [isAuthenticated, user, navigate, showMainButton, hideMainButton, impactOccurred]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = user?.role === 'master' ? [
    {
      icon: Calendar,
      title: 'Управление записями',
      description: 'Просматривайте и управляйте записями клиентов',
      action: () => navigate('/master/bookings'),
      color: 'bg-blue-500'
    },
    {
      icon: Scissors,
      title: 'Мои услуги',
      description: 'Настраивайте список услуг и цены',
      action: () => navigate('/master/services'),
      color: 'bg-purple-500'
    },
    {
      icon: User,
      title: 'Профиль',
      description: 'Настройте свой профиль и рабочий график',
      action: () => navigate('/master/profile'),
      color: 'bg-green-500'
    },
    {
      icon: TrendingUp,
      title: 'Статистика',
      description: 'Анализируйте свою работу',
      action: () => navigate('/master/stats'),
      color: 'bg-orange-500'
    }
  ] : [
    {
      icon: Sparkles,
      title: 'Найти мастера',
      description: 'Выберите подходящего специалиста',
      action: () => navigate('/client/masters'),
      color: 'bg-blue-500'
    },
    {
      icon: Calendar,
      title: 'Мои записи',
      description: 'Управляйте своими записями',
      action: () => navigate('/client/bookings'),
      color: 'bg-purple-500'
    },
    {
      icon: User,
      title: 'Профиль',
      description: 'Настройте свой профиль',
      action: () => navigate('/client/profile'),
      color: 'bg-green-500'
    },
    {
      icon: Clock,
      title: 'История',
      description: 'Просмотрите прошлые записи',
      action: () => navigate('/client/history'),
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Привет, {user?.firstName || 'Гость'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'master' 
              ? 'Управляйте своим бизнесом легко' 
              : 'Записывайтесь к лучшим мастерам'}
          </p>
        </div>

        {/* Quick Stats */}
        {user?.role === 'master' && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <div className="text-xs text-muted-foreground">Записей сегодня</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-xs text-muted-foreground">На этой неделе</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                impactOccurred('light');
                feature.action();
              }}
            >
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Последняя активность</CardTitle>
            <CardDescription>Недавние события</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Новая запись</p>
                  <p className="text-xs text-muted-foreground">15:00 - Маникюр</p>
                </div>
                <span className="text-xs text-muted-foreground">2 мин</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Новый клиент</p>
                  <p className="text-xs text-muted-foreground">Анна записалась</p>
                </div>
                <span className="text-xs text-muted-foreground">1 ч</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
