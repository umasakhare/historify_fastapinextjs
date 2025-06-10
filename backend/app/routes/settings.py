from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.settings import AppSettings, SettingsCreate, SettingsUpdate, SettingsResponse
from app.utils.data_fetcher import OPENALGO_AVAILABLE
from typing import Dict, Any
import json
import logging

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_settings(db: Session = Depends(get_db)):
    """Get all application settings"""
    try:
        settings = {}
        for setting in db.query(AppSettings).all():
            if setting.data_type == 'json':
                settings[setting.key] = json.loads(setting.value) if setting.value else None
            elif setting.data_type == 'boolean':
                settings[setting.key] = setting.value.lower() in ('true', '1', 'yes') if setting.value else False
            elif setting.data_type == 'integer':
                settings[setting.key] = int(setting.value) if setting.value else 0
            elif setting.data_type == 'float':
                settings[setting.key] = float(setting.value) if setting.value else 0.0
            else:
                settings[setting.key] = setting.value
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def update_settings(settings_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Update application settings"""
    try:
        results = {}
        errors = {}
        
        for key, value in settings_data.items():
            try:
                # Handle different data types
                if isinstance(value, dict) and 'value' in value and 'type' in value:
                    str_value = str(value['value']) if value['value'] is not None else None
                    data_type = value['type']
                    description = value.get('description')
                elif isinstance(value, bool):
                    str_value = str(value).lower()
                    data_type = 'boolean'
                    description = None
                elif isinstance(value, (list, dict)):
                    str_value = json.dumps(value)
                    data_type = 'json'
                    description = None
                else:
                    str_value = str(value) if value is not None else None
                    data_type = 'string'
                    description = None
                
                # Find or create setting
                setting = db.query(AppSettings).filter(AppSettings.key == key).first()
                if setting:
                    setting.value = str_value
                    setting.data_type = data_type
                    if description is not None:
                        setting.description = description
                else:
                    setting = AppSettings(
                        key=key,
                        value=str_value,
                        data_type=data_type,
                        description=description
                    )
                    db.add(setting)
                
                results[key] = 'updated'
                
            except Exception as e:
                errors[key] = str(e)
                logging.error(f"Error updating setting {key}: {e}")
        
        if not errors:
            db.commit()
            return {'status': 'success', 'message': 'Settings updated successfully', 'updated_settings': results}
        else:
            db.rollback()
            return {'status': 'error', 'message': 'Failed to update some settings', 'errors': errors, 'updated_settings': results}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-api")
async def test_api_connection(db: Session = Depends(get_db)):
    """Test OpenAlgo API connection"""
    try:
        if not OPENALGO_AVAILABLE:
            return {
                'success': False,
                'message': 'OpenAlgo module not available'
            }
        
        # Get API settings
        api_key_setting = db.query(AppSettings).filter(AppSettings.key == 'openalgo_api_key').first()
        host_setting = db.query(AppSettings).filter(AppSettings.key == 'openalgo_api_host').first()
        
        api_key = api_key_setting.value if api_key_setting else None
        host = host_setting.value if host_setting else 'http://127.0.0.1:5000'
        
        if not api_key:
            return {
                'success': False,
                'message': 'API key not configured'
            }
        
        # Test connection
        from openalgo import api
        client = api(api_key=api_key, host=host)
        
        try:
            response = client.quotes(symbol='RELIANCE', exchange='NSE')
            
            if isinstance(response, dict) and response.get('status') == 'success':
                quote_data = response.get('data', {})
                ltp = quote_data.get('ltp', 0)
                return {
                    'success': True,
                    'message': f'API connection successful! RELIANCE LTP: ₹{ltp}',
                    'data': {
                        'symbol': 'RELIANCE',
                        'exchange': 'NSE',
                        'ltp': ltp,
                        'host': host
                    }
                }
            else:
                error_msg = response.get('message', 'Unknown API error') if isinstance(response, dict) else 'Invalid response format'
                return {
                    'success': False,
                    'message': f'API error: {error_msg}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'API connection failed: {str(e)}'
            }
            
    except Exception as e:
        logging.error(f"Error testing API: {str(e)}")
        return {
            'success': False,
            'message': f'Connection test failed: {str(e)}'
        }