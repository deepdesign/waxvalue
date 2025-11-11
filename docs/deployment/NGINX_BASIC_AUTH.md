# Nginx HTTP Basic Authentication Management

This document explains how to manage HTTP Basic Authentication credentials for the WaxValue site.

## Location

The username/password credentials are stored in:
```
/etc/nginx/.htpasswd
```

This file is referenced in the nginx configuration (`nginx-waxvalue-fixed.conf`):
```nginx
auth_basic_user_file /etc/nginx/.htpasswd;
```

## Viewing Current Users

To see what usernames are currently configured:

```bash
sudo cat /etc/nginx/.htpasswd
```

This will display the file contents (passwords are hashed, so you'll only see the usernames - the part before the colon).

## Changing Password (Keep Same Username)

To change the password for an existing user:

```bash
sudo htpasswd /etc/nginx/.htpasswd username
```

You'll be prompted to enter the new password twice.

## Changing Username

To change the username, you need to delete the old one and create a new one:

1. **Delete the old username:**
   ```bash
   sudo htpasswd -D /etc/nginx/.htpasswd old_username
   ```

2. **Create a new username:**
   ```bash
   sudo htpasswd /etc/nginx/.htpasswd new_username
   ```

## Adding Additional Users

To add another user (without removing existing ones):

```bash
sudo htpasswd /etc/nginx/.htpasswd new_username
```

**Note:** Only use the `-c` flag when creating the file for the very first time. Using `-c` on an existing file will overwrite it and delete all existing users.

## Deleting a User

To remove a user:

```bash
sudo htpasswd -D /etc/nginx/.htpasswd username
```

## Enabling/Disabling Authentication

The HTTP Basic Authentication is configured in `nginx-waxvalue-fixed.conf`:

**To disable (current state):**
```nginx
# Password protection - COMMENTED OUT
# auth_basic "Waxvalue - Private Access";
# auth_basic_user_file /etc/nginx/.htpasswd;
```

**To enable:**
Uncomment those lines:
```nginx
# Password protection
auth_basic "Waxvalue - Private Access";
auth_basic_user_file /etc/nginx/.htpasswd;
```

After enabling/disabling, reload nginx:
```bash
sudo nginx -t  # Test the configuration first
sudo systemctl reload nginx  # Reload nginx
```

## Important Notes

- You need SSH access to your server and sudo privileges to modify the `.htpasswd` file
- Changes to the `.htpasswd` file take effect immediately (no nginx reload needed)
- However, if you enable/disable authentication in the nginx config, you must reload nginx
- The `.htpasswd` file should not be committed to version control for security reasons
- Passwords in the file are hashed, so you cannot "read" the password back - you can only change it

## Example Workflow

```bash
# 1. Check current users
sudo cat /etc/nginx/.htpasswd

# 2. Change password for existing user "admin"
sudo htpasswd /etc/nginx/.htpasswd admin

# 3. Or change username from "admin" to "newuser"
sudo htpasswd -D /etc/nginx/.htpasswd admin
sudo htpasswd /etc/nginx/.htpasswd newuser

# 4. If you re-enabled authentication, reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

