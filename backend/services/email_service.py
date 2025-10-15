#!/usr/bin/env python3
"""
Email Service for WaxValue Wanted List Notifications

This service handles sending email notifications for price alerts
and wanted list updates.

Follows development guidelines:
- Proper error handling and logging
- Security best practices
- Template-based email generation
- SMTP configuration management
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import Dict, List, Optional, Any
from datetime import datetime
import html
import re

logger = logging.getLogger(__name__)

class EmailService:
    """
    Service for sending email notifications.
    
    Supports multiple email providers and templates with
    proper error handling and delivery tracking.
    """
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@waxvalue.com')
        self.from_name = os.getenv('FROM_NAME', 'WaxValue')
        
        # Validate configuration
        if not self.smtp_username or not self.smtp_password:
            logger.warning("Email service not configured - SMTP credentials missing")
    
    async def send_email(self, email_data: Dict[str, Any]) -> bool:
        """
        Send email notification.
        
        Args:
            email_data: Dictionary containing email details
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.error("Cannot send email - SMTP credentials not configured")
                return False
            
            # Validate required fields
            if not email_data.get('to') or not email_data.get('subject'):
                logger.error("Missing required email fields: 'to' and 'subject'")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = email_data['to']
            msg['Subject'] = email_data['subject']
            
            # Add headers for better deliverability
            msg['X-Mailer'] = 'WaxValue/1.0'
            msg['X-Priority'] = '3'
            
            # Generate HTML and text content
            template_name = email_data.get('template', 'default')
            template_data = email_data.get('data', {})
            
            html_content = self._render_template(template_name, template_data, 'html')
            text_content = self._render_template(template_name, template_data, 'text')
            
            # Attach content parts
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                
                # Send the email
                server.send_message(msg)
                
            logger.info(f"✅ Email sent successfully to {email_data['to']}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP authentication failed: {e}")
            return False
        except smtplib.SMTPRecipientsRefused as e:
            logger.error(f"❌ Email recipient refused: {e}")
            return False
        except smtplib.SMTPServerDisconnected as e:
            logger.error(f"❌ SMTP server disconnected: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to send email: {e}")
            return False
    
    def _render_template(self, template_name: str, data: Dict[str, Any], format_type: str = 'html') -> str:
        """
        Render email template with provided data.
        
        Args:
            template_name: Name of the template to render
            data: Data to populate template
            format_type: 'html' or 'text'
            
        Returns:
            Rendered email content
        """
        try:
            if template_name == 'price_alert':
                return self._render_price_alert_template(data, format_type)
            elif template_name == 'welcome':
                return self._render_welcome_template(data, format_type)
            elif template_name == 'weekly_summary':
                return self._render_weekly_summary_template(data, format_type)
            else:
                return self._render_default_template(data, format_type)
                
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            return self._render_error_template(data, format_type)
    
    def _render_price_alert_template(self, data: Dict[str, Any], format_type: str) -> str:
        """Render price alert email template."""
        if format_type == 'html':
            return self._render_price_alert_html(data)
        else:
            return self._render_price_alert_text(data)
    
    def _render_price_alert_html(self, data: Dict[str, Any]) -> str:
        """Render price alert HTML template."""
        release_title = html.escape(data.get('release_title', 'Unknown Release'))
        artist_name = html.escape(data.get('artist_name', 'Unknown Artist'))
        listing_price = data.get('listing_price', 0)
        currency = data.get('currency', 'USD')
        condition = html.escape(data.get('condition', 'Unknown'))
        seller_name = html.escape(data.get('seller_name', 'Unknown Seller'))
        seller_rating = data.get('seller_rating', 0)
        listing_url = data.get('listing_url', '#')
        match_reason = html.escape(data.get('match_reason', ''))
        app_url = data.get('app_url', 'https://waxvalue.com/wanted-list')
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Price Alert - {release_title}</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8fafc;
                }}
                .container {{
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid #e5e7eb;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 8px;
                }}
                .alert-title {{
                    font-size: 24px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                }}
                .alert-subtitle {{
                    font-size: 16px;
                    color: #6b7280;
                    margin: 8px 0 0 0;
                }}
                .release-info {{
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 24px;
                    margin: 24px 0;
                    border-left: 4px solid #2563eb;
                }}
                .release-title {{
                    font-size: 20px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 8px 0;
                }}
                .release-artist {{
                    font-size: 16px;
                    color: #6b7280;
                    margin: 0 0 16px 0;
                }}
                .price-highlight {{
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 16px 24px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 16px 0;
                }}
                .price-amount {{
                    font-size: 32px;
                    font-weight: bold;
                    margin: 0;
                }}
                .price-currency {{
                    font-size: 16px;
                    opacity: 0.9;
                    margin: 4px 0 0 0;
                }}
                .details-grid {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin: 16px 0;
                }}
                .detail-item {{
                    background: white;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }}
                .detail-label {{
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin: 0 0 4px 0;
                }}
                .detail-value {{
                    font-size: 14px;
                    color: #1f2937;
                    font-weight: 500;
                    margin: 0;
                }}
                .match-reason {{
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 6px;
                    padding: 12px;
                    margin: 16px 0;
                }}
                .match-reason-text {{
                    font-size: 14px;
                    color: #92400e;
                    margin: 0;
                }}
                .actions {{
                    text-align: center;
                    margin: 32px 0;
                }}
                .btn {{
                    display: inline-block;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 0 8px 8px 8px;
                    transition: all 0.2s;
                }}
                .btn-primary {{
                    background: #2563eb;
                    color: white;
                }}
                .btn-primary:hover {{
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }}
                .btn-secondary {{
                    background: #6b7280;
                    color: white;
                }}
                .btn-secondary:hover {{
                    background: #4b5563;
                    transform: translateY(-1px);
                }}
                .footer {{
                    text-align: center;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 12px;
                }}
                .footer a {{
                    color: #2563eb;
                    text-decoration: none;
                }}
                @media (max-width: 600px) {{
                    .details-grid {{
                        grid-template-columns: 1fr;
                    }}
                    .btn {{
                        display: block;
                        margin: 8px 0;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🎵 WaxValue</div>
                    <h1 class="alert-title">Price Alert Triggered!</h1>
                    <p class="alert-subtitle">A release in your wanted list has matched your criteria</p>
                </div>
                
                <div class="release-info">
                    <h2 class="release-title">{release_title}</h2>
                    <p class="release-artist">{artist_name}</p>
                    
                    <div class="price-highlight">
                        <div class="price-amount">${listing_price:.2f}</div>
                        <div class="price-currency">{currency}</div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Condition</div>
                            <div class="detail-value">{condition}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Seller</div>
                            <div class="detail-value">{seller_name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Rating</div>
                            <div class="detail-value">{seller_rating:.1f}%</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Match Type</div>
                            <div class="detail-value">Price Alert</div>
                        </div>
                    </div>
                    
                    <div class="match-reason">
                        <p class="match-reason-text">💡 {match_reason}</p>
                    </div>
                </div>
                
                <div class="actions">
                    <a href="{listing_url}" class="btn btn-primary" target="_blank">
                        View on Discogs
                    </a>
                    <a href="{app_url}" class="btn btn-secondary">
                        View in WaxValue
                    </a>
                </div>
                
                <div class="footer">
                    <p>This alert was sent because a listing matched your wanted list criteria.</p>
                    <p>
                        <a href="{app_url}">Manage your wanted list</a> | 
                        <a href="mailto:support@waxvalue.com">Contact Support</a>
                    </p>
                    <p>© 2024 WaxValue. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_price_alert_text(self, data: Dict[str, Any]) -> str:
        """Render price alert text template."""
        release_title = data.get('release_title', 'Unknown Release')
        artist_name = data.get('artist_name', 'Unknown Artist')
        listing_price = data.get('listing_price', 0)
        currency = data.get('currency', 'USD')
        condition = data.get('condition', 'Unknown')
        seller_name = data.get('seller_name', 'Unknown Seller')
        seller_rating = data.get('seller_rating', 0)
        listing_url = data.get('listing_url', '#')
        match_reason = data.get('match_reason', '')
        app_url = data.get('app_url', 'https://waxvalue.com/wanted-list')
        
        return f"""
🎵 WAXVALUE PRICE ALERT

A release in your wanted list has matched your criteria!

RELEASE DETAILS:
Title: {release_title}
Artist: {artist_name}
Price: ${listing_price:.2f} {currency}
Condition: {condition}
Seller: {seller_name} ({seller_rating:.1f}% rating)

MATCH REASON:
{match_reason}

ACTIONS:
• View on Discogs: {listing_url}
• View in WaxValue: {app_url}

This alert was sent because a listing matched your wanted list criteria.

Manage your wanted list: {app_url}
Contact Support: support@waxvalue.com

© 2024 WaxValue. All rights reserved.
        """
    
    def _render_welcome_template(self, data: Dict[str, Any], format_type: str) -> str:
        """Render welcome email template."""
        if format_type == 'html':
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to WaxValue</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">🎵 Welcome to WaxValue!</h2>
                    <p>Thank you for joining WaxValue. Start monitoring your favorite releases today!</p>
                    <a href="https://waxvalue.com/wanted-list" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Create Your First Alert
                    </a>
                </div>
            </body>
            </html>
            """
        else:
            return """
🎵 Welcome to WaxValue!

Thank you for joining WaxValue. Start monitoring your favorite releases today!

Create your first alert: https://waxvalue.com/wanted-list

© 2024 WaxValue. All rights reserved.
            """
    
    def _render_weekly_summary_template(self, data: Dict[str, Any], format_type: str) -> str:
        """Render weekly summary email template."""
        # Placeholder implementation
        return self._render_default_template(data, format_type)
    
    def _render_default_template(self, data: Dict[str, Any], format_type: str) -> str:
        """Render default email template."""
        if format_type == 'html':
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>WaxValue Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">🎵 WaxValue</h2>
                    <p>You have a new notification from WaxValue.</p>
                </div>
            </body>
            </html>
            """
        else:
            return """
🎵 WaxValue Notification

You have a new notification from WaxValue.

© 2024 WaxValue. All rights reserved.
            """
    
    def _render_error_template(self, data: Dict[str, Any], format_type: str) -> str:
        """Render error template when template rendering fails."""
        if format_type == 'html':
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>WaxValue Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">🎵 WaxValue</h2>
                    <p>You have a notification from WaxValue.</p>
                </div>
            </body>
            </html>
            """
        else:
            return """
🎵 WaxValue Notification

You have a notification from WaxValue.

© 2024 WaxValue. All rights reserved.
            """
    
    def validate_email_address(self, email: str) -> bool:
        """Validate email address format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    async def send_bulk_emails(self, email_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Send multiple emails in batch.
        
        Args:
            email_list: List of email data dictionaries
            
        Returns:
            Dictionary with success/failure counts
        """
        results = {
            'total': len(email_list),
            'successful': 0,
            'failed': 0,
            'errors': []
        }
        
        for email_data in email_list:
            try:
                success = await self.send_email(email_data)
                if success:
                    results['successful'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to send to {email_data.get('to', 'unknown')}")
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error sending to {email_data.get('to', 'unknown')}: {str(e)}")
        
        logger.info(f"Bulk email results: {results['successful']}/{results['total']} successful")
        return results

# Global email service instance
email_service = EmailService()
