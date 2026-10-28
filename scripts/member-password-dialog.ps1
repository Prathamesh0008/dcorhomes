param([string]$Prompt = 'Administrator password')
$ErrorActionPreference = 'Stop'
# Refuse direct terminal use: the secret response is only for a captured parent pipe.
if ($env:DCORHOME_PASSWORD_PIPE -ne '1' -or -not [Console]::IsOutputRedirected) {
  throw 'Use the interactive Node account setup command.'
}
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Dcorhome - Private Password Entry'
$form.Size = New-Object System.Drawing.Size(560, 235)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$label = New-Object System.Windows.Forms.Label
$label.Text = $Prompt
$label.Location = New-Object System.Drawing.Point(20, 15)
$label.Size = New-Object System.Drawing.Size(505, 25)
$box = New-Object System.Windows.Forms.TextBox
$box.UseSystemPasswordChar = $true
$box.MaxLength = 128
$box.Location = New-Object System.Drawing.Point(20, 45)
$box.Size = New-Object System.Drawing.Size(505, 28)
$hint = New-Object System.Windows.Forms.Label
$hint.Text = 'Masked dots confirm typing. Use a unique 12-128 character passphrase.'
$hint.Location = New-Object System.Drawing.Point(20, 80)
$hint.Size = New-Object System.Drawing.Size(505, 35)
$ok = New-Object System.Windows.Forms.Button
$ok.Text = 'Continue'
$ok.Location = New-Object System.Drawing.Point(325, 130)
$ok.DialogResult = [System.Windows.Forms.DialogResult]::None
$ok.Add_Click({
  # The calling Node CLI applies the shared policy for new passwords.
  # This dialog also accepts existing credentials for verification; do not add a second policy here.
  $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Close()
})
$cancel = New-Object System.Windows.Forms.Button
$cancel.Text = 'Cancel'
$cancel.Location = New-Object System.Drawing.Point(425, 130)
$cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.AcceptButton = $ok
$form.CancelButton = $cancel
$form.Controls.AddRange(@($label, $box, $hint, $ok, $cancel))
$form.Add_Shown({ $form.Activate(); [void]$box.Focus() })
$result = $form.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write((@{ password = $box.Text } | ConvertTo-Json -Compress))
} else {
  [Console]::Out.Write('{"cancelled":true}')
}
$box.Clear()
$form.Dispose()
