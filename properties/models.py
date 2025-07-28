from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.conf import settings
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill
from django.urls import reverse
from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import os

class PropertyFeature(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Font Awesome icon class (e.g., 'fas fa-parking')")
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class PropertyCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Font Awesome icon class")
    
    class Meta:
        verbose_name_plural = 'Property Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Property(models.Model):
    PROPERTY_TYPE_CHOICES = [
        ('SALE', 'For Sale'),
        ('RENT', 'For Rent'),
    ]
    
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('PENDING', 'Pending'),
        ('SOLD', 'Sold'),
        ('RENTED', 'Rented'),
    ]
    
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    NEIGHBOURHOOD_CHOICES = [
        # South Delhi Neighborhoods
        ('ANAND_LOK', 'Anand Lok'),
        ('ANAND_NIKETAN', 'Anand Niketan'),
        ('ASOLA', 'Asola'),
        ('BANDH_ROAD', 'Bandh Road'),
        ('BIJWASAN', 'Bijwasan'),
        ('CR_PARK', 'C.R Park'),
        ('CHANAKYAPURI', 'Chanakyapuri'),
        ('CHANDAN_HOLA', 'Chandan Hola'),
        ('CHATTARPUR', 'Chattarpur'),
        ('DEFENCE_COLONY', 'Defence Colony'),
        ('DERA_MANDI', 'Dera Mandi'),
        ('DLF_PHASE_1', 'DLF Phase -1'),
        ('FATEHPUR_BERI', 'Fatehpur Beri'),
        ('GK_2', 'G.K 2'),
        ('GK_1', 'G.K-1'),
        ('GADAIPUR', 'Gadaipur'),
        ('GHITORNI', 'Ghitorni'),
        ('GOLF_LINKS', 'Golf Links'),
        ('GREEN_PARK_EXTENSION', 'Green Park Extension'),
        ('GREEN_PARK_MAIN', 'Green Park Main'),
        ('GULMOHAR_PARK', 'Gulmohar Park'),
        ('HAUZ_KHAS', 'Hauz Khas'),
        ('JANGPURA', 'Jangpura'),
        ('JANGPURA_EXTENSION', 'Jangpura Extension'),
        ('JOR_BAGH', 'Jor Bagh'),
        ('KAPASHERA', 'Kapashera'),
        ('LAJPAT_NAGAR', 'Lajpat Nagar'),
        ('MANDI_ROAD', 'Mandi Road'),
        ('MAYFAIR_GARDEN', 'Mayfair Garden'),
        ('NEETI_BAGH', 'Neeti Bagh'),
        ('NIZAMUDDIN_EAST', 'Nizamuddin East'),
        ('NIZAMUDDIN_WEST', 'Nizamuddin West'),
        ('PANCHSHEEL_PARK', 'Panchsheel Park'),
        ('PANSHEEL_ENCLAVE', 'Pansheel Enclave'),
        ('PUSHPANJALI', 'Pushpanjali'),
        ('RADHEY_MOHAN_DRIVE', 'Radhey Mohan Drive'),
        ('SAFDARJUNG_ENCLAVE', 'Safdarjung Enclave'),
        ('SARVODAYA_ENCLAVE', 'Sarvodaya Enclave'),
        ('SATBARI', 'Satbari'),
        ('SDA', 'SDA'),
        ('SHANTI_NIKETAN', 'Shanti Niketan'),
        ('SULTANPUR', 'Sultanpur'),
        ('SUNDAR_NAGAR', 'Sundar Nagar'),
        ('VASANT_KUNJ_FARMS', 'Vasant Kunj Farms'),
        ('VASANT_VIHAR', 'Vasant Vihar'),
        ('WESTEND', 'Westend'),
        ('WESTEND_GREENS', 'Westend Greens'),
    ]

=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    property_type = models.CharField(max_length=10, choices=PROPERTY_TYPE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='AVAILABLE')
    category = models.ForeignKey(PropertyCategory, on_delete=models.SET_NULL, null=True, related_name='properties')
    
    # Property Details
    bedrooms = models.PositiveIntegerField()
    bathrooms = models.DecimalField(max_digits=3, decimal_places=0)
    area = models.PositiveIntegerField(help_text="Area in square Meter")
    garages = models.PositiveIntegerField(default=0)
    year_built = models.PositiveIntegerField(null=True, blank=True)
    features = models.ManyToManyField(PropertyFeature, blank=True, related_name='properties')
    
    # Location
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    address = models.CharField(max_length=200, null=True, blank=True, help_text="Full address (only visible to agents and admins)")
    neighbourhood = models.CharField(max_length=20, choices=NEIGHBOURHOOD_CHOICES, default='OTHER', help_text="Neighbourhood of the property (only visible to agents and admins)")
    city = models.CharField(max_length=100, help_text="City where property is located (only visible to agents and admins)")
    state = models.CharField(max_length=100, null=True, blank=True, help_text="State where property is located")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Latitude coordinates")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Longitude coordinates")

=======
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
    address = models.CharField(max_length=200, null=True, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, null=True, blank=True)
    zip_code = models.CharField(max_length=20, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
    # Metadata
    agent = models.ForeignKey('agents.AgentProfile', on_delete=models.CASCADE, related_name='properties')
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('properties:detail', kwargs={'slug': self.slug})

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/images/%Y/%m/%d/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Thumbnails
    thumbnail = ImageSpecField(
        source='image',
        processors=[ResizeToFill(300, 200)],
        format='JPEG',
        options={'quality': 80}
    )
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = _('Property Image')
        verbose_name_plural = _('Property Images')

    def __str__(self):
        return f'Image for {self.property.title}'

    def save(self, *args, **kwargs):
        # If this is the first image for the property, make it primary
        if not self.property.images.exists() and not self.is_primary:
            self.is_primary = True
        super().save(*args, **kwargs)

class PropertyVideo(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=200)
    video = models.FileField(upload_to='properties/videos/%Y/%m/%d/')
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'Video for {self.property.title}'

class PropertyInquiry(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='inquiries')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Property Inquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f'Inquiry for {self.property.title} by {self.name}'

class PropertyViewing(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='viewings')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    preferred_date = models.DateField()
    preferred_time = models.TimeField()
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Property Viewings'
        ordering = ['-preferred_date', '-preferred_time']

    def __str__(self):
        return f'Viewing for {self.property.title} by {self.name}'
