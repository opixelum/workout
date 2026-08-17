import { api, User } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function AccountPage() {
  const user: User = await api.getUser();

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Bodyweight (kg)</p>
              <p className="text-sm">{user.bodyweight ? `${user.bodyweight} kg` : 'Not set'}</p>
            </div>

            <Button>Edit Profile</Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Password</h3>
            <Button variant="outline">Change Password</Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
