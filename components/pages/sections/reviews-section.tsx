"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, Plus, Trash2, Star } from "lucide-react"

interface Review {
  id: string
  name: string
  title: string
  company: string
  rating: number
  content: string
  avatar: string
  featured: boolean
  category: string
}

const categories = [
  { value: "general", label: "General" },
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "support", label: "Support" },
]

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      name: "John Smith",
      title: "CEO",
      company: "Tech Corp",
      rating: 5,
      content: "Excellent service and support. Highly recommended!",
      avatar: "",
      featured: true,
      category: "general",
    },
  ])

  const [newReview, setNewReview] = useState({
    name: "",
    title: "",
    company: "",
    rating: 5,
    content: "",
    avatar: "",
    featured: false,
    category: "general",
  })

  const addReview = () => {
    if (newReview.name && newReview.content) {
      const review: Review = {
        id: Date.now().toString(),
        ...newReview,
      }
      setReviews([...reviews, review])
      setNewReview({
        name: "",
        title: "",
        company: "",
        rating: 5,
        content: "",
        avatar: "",
        featured: false,
        category: "general",
      })
    }
  }

  const deleteReview = (id: string) => {
    setReviews(reviews.filter((review) => review.id !== id))
  }

  const updateReview = (id: string, field: keyof Review, value: string | number | boolean) => {
    setReviews(reviews.map((review) => (review.id === id ? { ...review, [field]: value } : review)))
  }

  const handleSave = () => {
    // TODO: Save to Supabase when integration is added
    console.log("Saving reviews data:", reviews)
  }

  const renderStars = (rating: number, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            } ${onRatingChange ? "cursor-pointer" : ""}`}
            onClick={() => onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Reviews & Testimonials</h3>
        <p className="text-sm text-muted-foreground">Manage customer reviews and testimonials</p>
      </div>

      {/* Add New Review */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Review</CardTitle>
          <CardDescription>Add customer testimonials and reviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="CEO, Marketing Director, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={newReview.company}
                onChange={(e) => setNewReview({ ...newReview, company: e.target.value })}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newReview.category}
                onValueChange={(value) => setNewReview({ ...newReview, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input
              value={newReview.avatar}
              onChange={(e) => setNewReview({ ...newReview, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            {renderStars(newReview.rating, (rating) => setNewReview({ ...newReview, rating }))}
          </div>

          <div className="space-y-2">
            <Label>Review Content</Label>
            <Textarea
              value={newReview.content}
              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
              placeholder="Write the customer's review or testimonial..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={newReview.featured}
              onCheckedChange={(checked) => setNewReview({ ...newReview, featured: checked })}
            />
            <Label>Featured review</Label>
          </div>

          <Button onClick={addReview} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Review
          </Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                    {review.avatar ? (
                      <img
                        src={review.avatar || "/placeholder.svg"}
                        alt={review.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">{review.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{review.name}</CardTitle>
                    <CardDescription>
                      {review.title} {review.company && `at ${review.company}`}
                      {review.featured && " • Featured"}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => deleteReview(review.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Rating</Label>
                  {renderStars(review.rating, (rating) => updateReview(review.id, "rating", rating))}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={review.featured}
                    onCheckedChange={(checked) => updateReview(review.id, "featured", checked)}
                  />
                  <Label className="text-xs">Featured</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Review Content</Label>
                <Textarea
                  value={review.content}
                  onChange={(e) => updateReview(review.id, "content", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={review.name} onChange={(e) => updateReview(review.id, "name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={review.title} onChange={(e) => updateReview(review.id, "title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={review.company} onChange={(e) => updateReview(review.id, "company", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Reviews
        </Button>
      </div>
    </div>
  )
}
