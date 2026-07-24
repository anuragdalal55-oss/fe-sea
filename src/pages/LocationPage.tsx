import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Location } from '../types';
import api from '../utils/api';

const LocationPage: React.FC = () => {
  const { selectedLocation, setSelectedLocation } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [sessionCode, setSessionCode] = useState(selectedLocation?.customs_house_code || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/locations')
      .then((response) => {
        const active = (response.data as Location[])
          .filter((item) => item.is_active && item.customs_house_code?.startsWith('IN'))
          .sort((left, right) => (left.customs_house_code || '').localeCompare(right.customs_house_code || ''));

        setLocations(active);
        if (selectedLocation) {
          const stillAvailable = active.find((item) => item.customs_house_code === selectedLocation.customs_house_code);
          if (stillAvailable) {
            setSessionCode(stillAvailable.customs_house_code ?? '');
          }
        }
      })
      .catch(() => toast.error('Failed to load locations'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleConfirmSession = () => {
    const location = locations.find((item) => item.customs_house_code === sessionCode);
    if (!location) {
      toast.error('Please select a port');
      return;
    }
    setSelectedLocation(location);
    toast.success(`Port set to ${location.city_name} (${location.customs_house_code})`);
    navigate('/mbl-register');
  };

  const selectedPort = locations.find((item) => item.customs_house_code === sessionCode);

  return (
    <div className="page-container">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Select Working Port</h1>
          <p className="page-subtitle">Choose the sea customs location you want to work with in this session</p>
        </div>
        {selectedLocation && (
          <button className="btn btn-secondary" onClick={() => navigate('/mbl-register')}>
            Back to Console
          </button>
        )}
      </div>

      <div style={{ maxWidth: 460 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Sea Session Location</span></div>
          <div className="card-body">
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              This port code will be used for all MBL and HBL activity in the sea app. You can change it any time.
            </p>

            {loading ? (
              <div className="loading-center"><span className="spinner"></span> Loading ports...</div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Sea Customs Location <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                  >
                    <option value="">Select location</option>
                    {locations.map((location) => (
                      <option key={location.customs_house_code} value={location.customs_house_code}>
                        {location.customs_house_code} - {location.city_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPort && (
                  <div className="sea-summary-card" style={{ marginBottom: 16 }}>
                    <div className="text-sm text-muted">Selected Port</div>
                    <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                      {selectedPort.customs_house_code}
                    </div>
                    <div className="text-sm">{selectedPort.city_name}</div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleConfirmSession}
                  disabled={!sessionCode}
                >
                  Confirm Port and Continue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
