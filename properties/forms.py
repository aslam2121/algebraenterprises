from django import forms
from .models import Property, PropertyImage, PropertyVideo, PropertyInquiry, PropertyViewing, PropertyFeature

class PropertyForm(forms.ModelForm):
    features = forms.ModelMultipleChoiceField(
        queryset=PropertyFeature.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={
            'class': 'feature-checkboxes',
            'data-toggle': 'tooltip',
            'title': 'Select or deselect features for this property'
        }),
        required=False,
        help_text="Select or deselect features for this property. You can remove features by unchecking them."
    )

    class Meta:
        model = Property
        fields = [
            'title', 'description', 'price', 'property_type', 'status',
            'category', 'bedrooms', 'bathrooms', 'area', 'garages',
            'year_built', 'features', 'address', 'neighbourhood', 'city', 'state',
            'latitude', 'longitude'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'price': forms.NumberInput(attrs={'min': 0}),
            'bedrooms': forms.NumberInput(attrs={'min': 0}),
            'bathrooms': forms.NumberInput(attrs={'min': 0, 'step': '0.5'}),
            'area': forms.NumberInput(attrs={'min': 0}),
            'garages': forms.NumberInput(attrs={'min': 0}),
            'year_built': forms.NumberInput(attrs={'min': 1800, 'max': 2100}),
            'address': forms.TextInput(attrs={'placeholder': 'Enter full address'}),
            'city': forms.TextInput(attrs={'placeholder': 'Enter city name'}),
            'latitude': forms.NumberInput(attrs={'step': 'any'}),
            'longitude': forms.NumberInput(attrs={'step': 'any'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Show address fields only to agents and admins
        if user and (user.is_agent or user.is_admin):
            # Address fields are already included in the form
            pass
        else:
            # Remove address fields for non-agents/admins
            if 'address' in self.fields:
                del self.fields['address']
            if 'neighbourhood' in self.fields:
                del self.fields['neighbourhood']
            if 'city' in self.fields:
                del self.fields['city']

class PropertyImageForm(forms.ModelForm):
    class Meta:
        model = PropertyImage
        fields = ['image', 'caption', 'is_primary']
        widgets = {
            'caption': forms.TextInput(attrs={'placeholder': 'Enter image caption'}),
        }

class PropertyVideoForm(forms.ModelForm):
    class Meta:
        model = PropertyVideo
        fields = ['title', 'video', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }

class PropertyInquiryForm(forms.ModelForm):
    class Meta:
        model = PropertyInquiry
        fields = ['name', 'email', 'phone', 'message']
        widgets = {
            'message': forms.Textarea(attrs={'rows': 4}),
        }

class PropertyViewingForm(forms.ModelForm):
    class Meta:
        model = PropertyViewing
        fields = ['name', 'email', 'phone', 'preferred_date', 'preferred_time', 'message']
        widgets = {
            'preferred_date': forms.DateInput(attrs={'type': 'date'}),
            'preferred_time': forms.TimeInput(attrs={'type': 'time'}),
            'message': forms.Textarea(attrs={'rows': 4}),
        } 