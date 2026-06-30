import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { LiveLogs } from '@/components/LiveLogs';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import PricingComparison from '@/components/profile/PricingComparison';
import { useProfileData } from './profile/useProfileData';
import EditProfileDialog from './profile/EditProfileDialog';
import SettingsProfileDialog from './profile/SettingsProfileDialog';

export default function Profile() {
  const {
    navigate,
    logs,
    clearLogs,
    isLoggingOut,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    isSaving,
    isSavingSettings,
    userProfile,
    isLoadingProfile,
    editForm,
    setEditForm,
    settingsForm,
    setSettingsForm,
    currentPlan,
    userStats,
    handleLogout,
    handleEditClick,
    handleSaveProfile,
    handleSettingsClick,
    handleSaveSettings,
  } = useProfileData();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 min-h-[44px]"
          >
            <Icon name="ArrowLeft" size={20} />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 min-h-[44px]"
          >
            {isLoggingOut ? (
              <>
                <Icon name="Loader2" size={20} className="animate-spin" />
                Выход...
              </>
            ) : (
              <>
                <Icon name="LogOut" size={20} />
                Выйти
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ProfileHeader 
              userProfile={userProfile}
              currentPlan={currentPlan}
              onEditClick={handleEditClick}
              onSettingsClick={handleSettingsClick}
            />
            <ProfileStats userStats={userStats} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <SubscriptionCard 
              currentPlan={currentPlan}
              onChangePlan={() => navigate('/pricing')}
            />
            <PricingComparison 
              currentPlanId={userProfile.selected_plan || 'free'}
              onViewAllPlans={() => navigate('/pricing')}
            />
          </div>
        </div>
      </div>

      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        isSaving={isSaving}
        onSave={handleSaveProfile}
      />

      <SettingsProfileDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        settingsForm={settingsForm}
        setSettingsForm={setSettingsForm}
        isSavingSettings={isSavingSettings}
        onSave={handleSaveSettings}
      />

      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}
