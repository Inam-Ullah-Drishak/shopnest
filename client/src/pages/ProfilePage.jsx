import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

function ProfilePage() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/users/profile');
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load profile');

        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userInfo, navigate, logout]);

  if (loading) return <p className="p-8">Loading...</p>;

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="border rounded p-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium">{profile.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{profile.email}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Account Type</p>
          <p className="font-medium">{profile.isAdmin ? 'Admin' : 'Customer'}</p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;