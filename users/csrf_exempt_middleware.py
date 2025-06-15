"""
Custom CSRF exemption middleware that completely bypasses CSRF protection
for specific URLs before Django's CSRF middleware processes the request.
"""

import re
from django.utils.deprecation import MiddlewareMixin


class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware to exempt specific URLs from CSRF protection.
    This must be placed BEFORE Django's CsrfViewMiddleware in MIDDLEWARE setting.
    """
    
    # URLs that should be completely exempt from CSRF protection
    CSRF_EXEMPT_URLS = [
        r'^/api/users/login/$',
        r'^/api/users/register/$',
        r'^/users/login/$',
        r'^/users/register/$',
    ]
    
    def __init__(self, get_response):
        super().__init__(get_response)
        # Compile regex patterns for better performance
        self.exempt_patterns = [re.compile(pattern) for pattern in self.CSRF_EXEMPT_URLS]
    
    def process_request(self, request):
        """
        Check if the current request URL should be exempt from CSRF protection.
        If so, mark the request to skip CSRF checks.
        """
        path = request.path_info
        
        # Check if the current path matches any exempt pattern
        for pattern in self.exempt_patterns:
            if pattern.match(path):
                print(f"🔍 CSRFExemptMiddleware: Exempting {path} from CSRF protection")
                # Mark the request to skip CSRF checks
                setattr(request, '_dont_enforce_csrf_checks', True)
                break
        
        return None
